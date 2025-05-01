using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using DocumentFormat.OpenXml.Spreadsheet;

namespace EmployeeManagementServer.Services
{
    public class ContractorService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ContractorService> _logger;

        public ContractorService(ApplicationDbContext context, ILogger<ContractorService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task UpdateContractorAsync(
            Contractor contractor,
            List<IFormFile> newPhotos,
            List<IFormFile> newDocumentPhotos,
            List<int> deletedPhotoIds)
        {
            try
            {
                _logger.LogInformation("Начинаем обновление фотографий для контрагента с ID {Id}", contractor.Id);

                // Логирование удаления фотографий
                if (deletedPhotoIds != null && deletedPhotoIds.Any())
                {
                    await LogContractorChangeAsync(
                        contractor.Id,
                        "Photos",
                        $"Удалено {deletedPhotoIds.Count} фотографий",
                    string.Empty,
                        User.Identity?.Name ?? "Unknown"
                    );
                }

                // Удаление старых фотографий
                await RemovePhotosAsync(contractor, deletedPhotoIds);
                _logger.LogInformation("Старые фотографии успешно удалены для контрагента с ID {Id}", contractor.Id);

                // Логирование добавления новых фотографий
                if ((newPhotos != null && newPhotos.Any()) || (newDocumentPhotos != null && newDocumentPhotos.Any()))
                {
                    int newPhotoCount = (newPhotos?.Count ?? 0) + (newDocumentPhotos?.Count ?? 0);
                    await LogContractorChangeAsync(
                        contractor.Id,
                        "Photos",
                        string.Empty,
                        $"Добавлено {newPhotoCount} новых фотографий",
                        User.Identity?.Name ?? "Unknown"
                    );
                }

                // Добавление новых фотографий
                await AddPhotosAsync(contractor, newPhotos, false);
                await AddPhotosAsync(contractor, newDocumentPhotos, true);
                _logger.LogInformation("Новые фотографии успешно добавлены для контрагента с ID {Id}", contractor.Id);

                // Проверка уникальности SortOrder
                if (contractor.SortOrder.HasValue && await _context.Contractors.AnyAsync(c => c.SortOrder == contractor.SortOrder && c.Id != contractor.Id))
                {
                    throw new InvalidOperationException("Контрагент с таким значением SortOrder уже существует.");
                }

                // Обновление данных контрагента в базе данных
                _context.Contractors.Update(contractor);
                await SaveChangesAsync();

                _logger.LogInformation("Изменения для контрагента с ID {Id} успешно сохранены в базе данных.", contractor.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении контрагента с ID {Id}.", contractor.Id);
                throw;
            }
        }

        private async Task RemovePhotosAsync(Contractor contractor, List<int> photoIds)
        {
            if (photoIds == null || !photoIds.Any()) return;

            var photosToDelete = contractor.Photos
                .Where(photo => photoIds.Contains(photo.Id))
                .ToList();

            foreach (var photo in photosToDelete)
            {
                if (File.Exists(photo.FilePath))
                {
                    File.Delete(photo.FilePath);
                }
            }

            _context.ContractorPhoto.RemoveRange(photosToDelete);
        }

        private async Task AddPhotosAsync(Contractor contractor, List<IFormFile> photos, bool isDocumentPhoto)
        {
            if (photos == null || !photos.Any()) return;

            foreach (var photo in photos)
            {
                var photoPath = await SavePhotoAsync(photo, isDocumentPhoto);
                contractor.Photos.Add(new ContractorPhoto
                {
                    FilePath = photoPath,
                    IsDocumentPhoto = isDocumentPhoto,
                    ContractorId = contractor.Id
                });
            }
        }

        public async Task<string> SavePhotoAsync(IFormFile photo, bool isDocumentPhoto)
        {
            var folder = isDocumentPhoto ? Path.Combine("wwwroot", "Uploads", "documents") : Path.Combine("wwwroot", "Uploads", "photos");
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(photo.FileName);
            var filePath = Path.Combine(folder, uniqueFileName);

            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await photo.CopyToAsync(fileStream);
            }

            return filePath;
        }

        public async Task<List<Contractor>> GetAllContractorsAsync(bool includeArchived = false)
        {
            var query = _context.Contractors
                .Include(c => c.Photos)
                .AsQueryable();

            if (!includeArchived)
            {
                query = query.Where(c => !c.IsArchived);
            }

            return await query.OrderBy(c => c.SortOrder).ToListAsync();
        }

        public async Task<Contractor> GetContractorByIdAsync(int id)
        {
            return await _context.Contractors
                .Include(c => c.Passes)
                .ThenInclude(p => p.PassType)
                .Include(c => c.Passes)
                .ThenInclude(p => p.ClosedByUser)
                .Include(c => c.Photos)
                .Include(c => c.History)
                .SingleOrDefaultAsync(c => c.Id == id);
        }

        public async Task CreateContractorAsync(Contractor contractor)
        {
            _context.Contractors.Add(contractor);
            await SaveChangesAsync();

            if (!contractor.SortOrder.HasValue)
            {
                contractor.SortOrder = contractor.Id;

                if (await _context.Contractors.AnyAsync(c => c.SortOrder == contractor.SortOrder && c.Id != contractor.Id))
                {
                    throw new InvalidOperationException("Контрагент с таким значением SortOrder уже существует.");
                }

                await SaveChangesAsync();
            }
        }

        public async Task<Contractor?> FindContractorByPassportSerialNumberAsync(string passportSerialNumber)
        {
            return await _context.Contractors
                .Include(c => c.Photos)
                .FirstOrDefaultAsync(c => c.PassportSerialNumber == passportSerialNumber);
        }

        public async Task<int> GetTotalContractorsCountAsync(bool includeArchived = false)
        {
            var query = _context.Contractors.AsQueryable();
            if (!includeArchived)
            {
                query = query.Where(c => !c.IsArchived);
            }
            return await query.CountAsync();
        }

        public async Task<List<Contractor>> GetContractorsAsync(int skip, int take, bool includeArchived = false)
        {
            var query = _context.Contractors
                .Include(c => c.Photos)
                .Include(c => c.Passes)
                .ThenInclude(p => p.PassType)
                .AsQueryable();

            if (!includeArchived)
            {
                query = query.Where(c => !c.IsArchived);
            }

            var contractors = await query
                .OrderBy(c => c.SortOrder)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            _logger.LogInformation("Contractors Passes: {@Passes}", contractors.Select(c => new { c.Id, Passes = c.Passes }));
            return contractors;
        }

        public async Task<object> GetContractorAsync(int id)
        {
            var contractor = await _context.Contractors
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    id = c.Id,
                    firstName = c.FirstName,
                    lastName = c.LastName,
                    middleName = c.MiddleName,
                    isArchived = c.IsArchived,
                    activePasses = c.Passes
                        .Where(p => !p.IsClosed)
                        .Select(p => new
                        {
                            id = p.Id,
                            passTypeId = p.PassTypeId,
                            contractorId = p.ContractorId,
                            storeId = p.StoreId,
                            position = p.Position,
                            startDate = p.StartDate,
                            endDate = p.EndDate,
                            transactionDate = p.TransactionDate,
                            isClosed = p.IsClosed,
                            passStatus = p.PassStatus,
                            printStatus = p.PrintStatus
                        }).ToList(),
                    closedPasses = c.Passes
                        .Where(p => p.IsClosed)
                        .Select(p => new
                        {
                            id = p.Id,
                            passTypeId = p.PassTypeId,
                            contractorId = p.ContractorId,
                            storeId = p.StoreId,
                            position = p.Position,
                            startDate = p.StartDate,
                            endDate = p.EndDate,
                            transactionDate = p.TransactionDate,
                            isClosed = p.IsClosed,
                            passStatus = p.PassStatus,
                            printStatus = p.PrintStatus
                        }).ToList(),
                    history = c.History.Select(h => new
                    {
                        h.Id,
                        h.FieldName,
                        h.OldValue,
                        h.NewValue,
                        h.ChangedAt,
                        h.ChangedBy
                    }).ToList()
                })
                .SingleOrDefaultAsync();

            return contractor ?? throw new Exception("Contractor not found");
        }

        public async Task<string?> GetLastNonDocumentPhotoAsync(int contractorId)
        {
            var contractor = await _context.Contractors
                .Include(c => c.Photos)
                .FirstOrDefaultAsync(c => c.Id == contractorId);

            if (contractor == null || !contractor.Photos.Any())
                return null;

            var photo = contractor.Photos
                .Where(p => !p.IsDocumentPhoto)
                .OrderByDescending(p => p.Id)
                .FirstOrDefault();

            return photo?.FilePath;
        }

        public async Task<bool> ArchiveContractorAsync(int id, string archivedBy)
        {
            var contractor = await _context.Contractors
                .Include(c => c.Passes)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (contractor == null)
            {
                return false;
            }

            if (contractor.Passes.Any(p => p.PassStatus == "Active"))
            {
                throw new InvalidOperationException("Нельзя архивировать контрагента с активными пропусками.");
            }

            contractor.IsArchived = true;
            await LogContractorChangeAsync(id, "IsArchived", "False", "True", archivedBy);

            await SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnarchiveContractorAsync(int id, string unarchivedBy)
        {
            var contractor = await _context.Contractors
                .FirstOrDefaultAsync(c => c.Id == id);

            if (contractor == null || !contractor.IsArchived)
            {
                return false;
            }

            contractor.IsArchived = false;
            await LogContractorChangeAsync(id, "IsArchived", "True", "False", unarchivedBy);

            await SaveChangesAsync();
            return true;
        }

        public async Task LogContractorChangeAsync(int contractorId, string fieldName, string oldValue, string newValue, string changedBy)
        {
            var historyEntry = new ContractorHistory
            {
                ContractorId = contractorId,
                FieldName = fieldName,
                OldValue = oldValue,
                NewValue = newValue,
                ChangedAt = DateTime.UtcNow,
                ChangedBy = changedBy
            };

            _context.ContractorHistories.Add(historyEntry);
            await SaveChangesAsync();
        }

        public async Task<List<ContractorHistory>> GetContractorHistoryAsync(int contractorId)
        {
            return await _context.ContractorHistories
                .Where(h => h.ContractorId == contractorId)
                .OrderByDescending(h => h.ChangedAt)
                .ToListAsync();
        }
    }
}