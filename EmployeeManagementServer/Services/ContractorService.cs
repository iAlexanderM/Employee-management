using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.Extensions.Logging;
using System.Linq;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Text.Json;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public class ContractorService : IContractorService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHistoryService _historyService;
        private readonly ILogger<ContractorService> _logger;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public ContractorService(
            ApplicationDbContext context,
            IHistoryService historyService,
            ILogger<ContractorService> logger)
        {
            _context = context;
            _historyService = historyService;
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
            List<int> deletedPhotoIds,
            string updatedBy = "Unknown")
        {
            _logger.LogInformation("Начинаем обновление контрагента с ID {Id}", contractor.Id);

            // Загружаем оригинального контрагента для сравнения
            var originalContractor = await _context.Contractors
                .AsNoTracking()
                .Include(c => c.Photos)
                .FirstOrDefaultAsync(c => c.Id == contractor.Id);

            var contractorToUpdate = await _context.Contractors
                .Include(c => c.Photos)
                .FirstOrDefaultAsync(c => c.Id == contractor.Id);

            if (contractorToUpdate == null)
            {
                _logger.LogWarning("Контрагент с ID {Id} не найден для обновления.", contractor.Id);
                throw new KeyNotFoundException($"Контрагент с ID {contractor.Id} не найден.");
            }

            // Проверка уникальности PassportSerialNumber
            if (originalContractor != null && originalContractor.PassportSerialNumber != contractor.PassportSerialNumber)
            {
                if (!string.IsNullOrWhiteSpace(contractor.PassportSerialNumber) &&
                    await _context.Contractors.AnyAsync(c => c.PassportSerialNumber == contractor.PassportSerialNumber && c.Id != contractor.Id))
                {
                    _logger.LogWarning("Попытка обновить контрагента {Id} с дублирующимся номером паспорта: {PassportSerialNumber}",
                        contractor.Id, contractor.PassportSerialNumber);
                    throw new InvalidOperationException($"Контрагент с серийным номером паспорта '{contractor.PassportSerialNumber}' уже существует.");
                }
            }

            // Проверка уникальности SortOrder
            if (contractor.SortOrder.HasValue && originalContractor?.SortOrder != contractor.SortOrder)
            {
                if (await _context.Contractors.AnyAsync(c => c.SortOrder == contractor.SortOrder && c.Id != contractor.Id))
                {
                    _logger.LogWarning("Попытка обновить контрагента {Id} с дублирующимся SortOrder: {SortOrder}",
                        contractor.Id, contractor.SortOrder);
                    throw new InvalidOperationException("Контрагент с таким значением SortOrder уже существует.");
                }
            }

            // Формируем список изменений
            var changes = CompareContractors(originalContractor, contractor);

            // Обновляем поля контрагента
            _context.Entry(contractorToUpdate).CurrentValues.SetValues(contractor);

            // Обрабатываем удаление фотографий
            if (deletedPhotoIds != null && deletedPhotoIds.Any())
            {
                await RemovePhotosAsync(contractorToUpdate, deletedPhotoIds);
                _logger.LogInformation("{Count} старых фотографий отмечены к удалению.", deletedPhotoIds.Count);
                changes.Add("photosRemoved", new ChangeValueDto
                {
                    OldValue = deletedPhotoIds,
                    NewValue = null
                });
            }

            // Обрабатываем добавление новых фотографий
            if (newPhotos != null && newPhotos.Any())
            {
                await AddPhotosAsync(contractorToUpdate, newPhotos, false);
                _logger.LogInformation("{Count} новых фотографий отмечены к добавлению.", newPhotos.Count);
                changes.Add("photosAdded", new ChangeValueDto
                {
                    OldValue = null,
                    NewValue = newPhotos.Select(p => p.FileName).ToList()
                });
            }

            // Обрабатываем добавление новых фото документов
            if (newDocumentPhotos != null && newDocumentPhotos.Any())
            {
                await AddPhotosAsync(contractorToUpdate, newDocumentPhotos, true);
                _logger.LogInformation("{Count} новых фото документов отмечены к добавлению.", newDocumentPhotos.Count);
                changes.Add("documentPhotosAdded", new ChangeValueDto
                {
                    OldValue = null,
                    NewValue = newDocumentPhotos.Select(p => p.FileName).ToList()
                });
            }

            await SaveChangesAsync();

            // Логируем изменения в историю
            if (changes.Any())
            {
                var historyEntry = new History
                {
                    EntityType = "contractor",
                    EntityId = contractor.Id.ToString(),
                    Action = "update",
                    Details = $"Обновлены данные контрагента с ID {contractor.Id}.",
                    ChangesJson = JsonSerializer.Serialize(changes, _jsonOptions),
                    ChangedBy = updatedBy,
                    ChangedAt = DateTime.UtcNow
                };
                _logger.LogInformation("Создание записи истории: ChangesJson={ChangesJson}", historyEntry.ChangesJson);
                await _historyService.LogHistoryAsync(historyEntry);
                _logger.LogInformation("Изменения для контрагента ID {Id} успешно записаны в историю.", contractor.Id);
            }
            else
            {
                _logger.LogInformation("Изменений для контрагента ID {Id} не обнаружено, история не записана.", contractor.Id);
            }

            _logger.LogInformation("Обновление контрагента (ID: {Id}) и все связанные изменения успешно сохранены.", contractor.Id);
        }

        private async Task RemovePhotosAsync(Contractor contractor, List<int> photoIds)
        {
            if (photoIds == null || !photoIds.Any()) return;

            if (contractor.Photos == null || !contractor.Photos.Any())
            {
                await _context.Entry(contractor).Collection(c => c.Photos).LoadAsync();
                if (contractor.Photos == null) return;
            }

            var photosToDelete = contractor.Photos
                .Where(photo => photoIds.Contains(photo.Id))
                .ToList();

            if (!photosToDelete.Any()) return;

            foreach (var photo in photosToDelete)
            {
                if (File.Exists(photo.FilePath))
                {
                    try
                    {
                        File.Delete(photo.FilePath);
                        _logger.LogInformation("Файл фотографии удален с диска: {FilePath}", photo.FilePath);
                    }
                    catch (IOException ex)
                    {
                        _logger.LogError(ex, "Ошибка при удалении файла фотографии с диска: {FilePath}", photo.FilePath);
                    }
                    catch (UnauthorizedAccessException ex)
                    {
                        _logger.LogError(ex, "Ошибка доступа при удалении файла фотографии с диска: {FilePath}", photo.FilePath);
                    }
                }
                else
                {
                    _logger.LogWarning("Файл фотографии не найден на диске для удаления: {FilePath}", photo.FilePath);
                }
            }

            _context.ContractorPhoto.RemoveRange(photosToDelete);
            _logger.LogInformation("{Count} записей о фотографиях отмечены к удалению из БД.", photosToDelete.Count);
        }

        private async Task AddPhotosAsync(Contractor contractor, List<IFormFile> photos, bool isDocumentPhoto)
        {
            if (photos == null || !photos.Any()) return;

            if (contractor.Photos == null)
            {
                await _context.Entry(contractor).Collection(c => c.Photos).LoadAsync();
                if (contractor.Photos == null)
                {
                    contractor.Photos = new List<ContractorPhoto>();
                }
            }

            foreach (var photo in photos)
            {
                if (photo.Length > 0)
                {
                    try
                    {
                        var photoPath = await SavePhotoAsync(photo, isDocumentPhoto);
                        contractor.Photos.Add(new ContractorPhoto
                        {
                            FilePath = photoPath,
                            IsDocumentPhoto = isDocumentPhoto,
                            ContractorId = contractor.Id
                        });
                        _logger.LogInformation("Фотография сохранена на диск и добавлена в коллекцию для контрагента ID {Id}: {FilePath}", contractor.Id, photoPath);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Ошибка при сохранении файла фотографии и добавлении его в контекст.");
                    }
                }
                else
                {
                    _logger.LogWarning("Получен пустой файл для загрузки для контрагента ID {Id}.", contractor.Id);
                }
            }
        }

        public async Task<string> SavePhotoAsync(IFormFile photo, bool isDocumentPhoto)
        {
            var folderName = isDocumentPhoto ? "documents" : "photos";
            var folder = Path.Combine("wwwroot", "Uploads", folderName);
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + photo.FileName;
            var filePath = Path.Combine(folder, uniqueFileName);

            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            await using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await photo.CopyToAsync(fileStream);
            }

            return filePath;
        }

        public async Task<List<Contractor>> GetAllContractorsAsync()
        {
            return await _context.Contractors
                .Include(c => c.Photos)
                .OrderBy(c => c.SortOrder)
                .ToListAsync();
        }

        public async Task<Contractor> GetContractorByIdAsync(int id)
        {
            var contractor = await _context.Contractors
                .Include(c => c.Passes)
                    .ThenInclude(p => p.PassType)
                .Include(c => c.Passes)
                    .ThenInclude(p => p.ClosedByUser)
                .Include(c => c.Photos)
                .SingleOrDefaultAsync(c => c.Id == id);

            if (contractor == null)
            {
                _logger.LogWarning("Контрагент с ID {Id} не найден.", id);
                throw new KeyNotFoundException($"Контрагент с ID {id} не найден.");
            }

            return contractor;
        }

        public async Task CreateContractorAsync(Contractor contractor, string? createdBy = null)
        {
            if (contractor == null)
            {
                _logger.LogWarning("Получен null объект контрагента для создания.");
                throw new ArgumentNullException(nameof(contractor));
            }

            if (contractor.SortOrder.HasValue && await _context.Contractors.AnyAsync(c => c.SortOrder == contractor.SortOrder))
            {
                _logger.LogWarning("Попытка создать контрагента с дублирующимся SortOrder: {SortOrder}", contractor.SortOrder);
                throw new InvalidOperationException($"Контрагент с таким значением SortOrder уже существует.");
            }

            if (!string.IsNullOrWhiteSpace(contractor.PassportSerialNumber) && await _context.Contractors.AnyAsync(c => c.PassportSerialNumber == contractor.PassportSerialNumber))
            {
                _logger.LogWarning("Попытка создать контрагента с дублирующимся номером паспорта: {PassportSerialNumber}", contractor.PassportSerialNumber);
                throw new InvalidOperationException($"Контрагент с серийным номером паспорта '{contractor.PassportSerialNumber}' уже существует.");
            }

            if (contractor.Note != null && contractor.Note.Length > 500)
            {
                _logger.LogWarning("Заметка для нового контрагента превышает 500 символов.");
                throw new ArgumentException("Заметка не должна превышать 500 символов.");
            }

            _context.Contractors.Add(contractor);
            await SaveChangesAsync();

            if (!contractor.SortOrder.HasValue)
            {
                contractor.SortOrder = contractor.Id;
                _context.Contractors.Update(contractor);
                await SaveChangesAsync();
            }

            await _historyService.LogHistoryAsync(new History
            {
                EntityType = "contractor",
                EntityId = contractor.Id.ToString(),
                Action = "create",
                Details = $"Контрагент {contractor.Id} успешно создан.",
                ChangesJson = "{}", // Пустой JSON для избежания детализации
                ChangedBy = createdBy ?? "Unknown",
                ChangedAt = DateTime.UtcNow
            });

            _logger.LogInformation("Контрагент с ID {ContractorId} успешно создан пользователем {CreatedBy} и запись истории сохранена.", contractor.Id, createdBy ?? "Unknown");
        }

        public async Task<Contractor?> FindContractorByPassportSerialNumberAsync(string passportSerialNumber)
        {
            if (string.IsNullOrWhiteSpace(passportSerialNumber))
            {
                return null;
            }
            return await _context.Contractors
                .Include(c => c.Photos)
                .FirstOrDefaultAsync(c => c.PassportSerialNumber == passportSerialNumber);
        }

        public async Task<int> GetTotalContractorsCountAsync(bool? isArchived = false)
        {
            var query = _context.Contractors.AsQueryable();

            if (isArchived.HasValue)
            {
                query = query.Where(c => c.IsArchived == isArchived.Value);
            }

            return await query.CountAsync();
        }

        public async Task<List<Contractor>> GetContractorsAsync(int skip, int take, bool? isArchived = false)
        {
            var query = _context.Contractors
                .Include(c => c.Photos)
                .Include(c => c.Passes)
                    .ThenInclude(p => p.PassType)
                .AsNoTracking()
                .AsQueryable();

            if (isArchived.HasValue)
            {
                query = query.Where(c => c.IsArchived == isArchived.Value);
            }

            var contractors = await query
                .OrderBy(c => c.SortOrder)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            return contractors;
        }

        public async Task<object> GetContractorAsync(int id)
        {
            var contractor = await GetContractorByIdAsync(id);

            var photosList = contractor.Photos?.Select(p => (object)new
            {
                id = p.Id,
                filePath = p.FilePath,
                isDocumentPhoto = p.IsDocumentPhoto,
                contractorId = p.ContractorId
            }).ToList() ?? new List<object>();

            var passesList = contractor.Passes?
                .OrderByDescending(p => p.StartDate)
                .Select(p => (object)new
                {
                    id = p.Id,
                    uniquePassId = p.UniquePassId,
                    passTypeId = p.PassTypeId,
                    passTypeName = p.PassType?.Name ?? "Unknown",
                    cost = p.PassType?.Cost,
                    contractorId = p.ContractorId,
                    storeId = p.StoreId,
                    position = p.Position,
                    startDate = p.StartDate,
                    endDate = p.EndDate,
                    transactionDate = p.TransactionDate,
                    isClosed = p.IsClosed,
                    passStatus = p.PassStatus,
                    printStatus = p.PrintStatus,
                    closeReason = p.CloseReason,
                    closeDate = p.CloseDate,
                    closedBy = p.ClosedBy,
                    closedByUserName = p.ClosedByUser?.UserName
                }).ToList() ?? new List<object>();

            var response = new
            {
                contractor.Id,
                contractor.FirstName,
                contractor.LastName,
                contractor.MiddleName,
                contractor.Citizenship,
                contractor.Nationality,
                contractor.BirthDate,
                contractor.DocumentType,
                contractor.PassportSerialNumber,
                contractor.PassportIssuedBy,
                contractor.PassportIssueDate,
                contractor.PhoneNumber,
                contractor.ProductType,
                contractor.IsArchived,
                contractor.SortOrder,
                contractor.CreatedAt,
                contractor.Note,
                Photos = photosList,
                Passes = passesList
            };

            return response;
        }

        public async Task<string?> GetLastNonDocumentPhotoAsync(int contractorId)
        {
            var photo = await _context.ContractorPhoto
                .AsNoTracking()
                .Where(p => p.ContractorId == contractorId && !p.IsDocumentPhoto)
                .OrderByDescending(p => p.Id)
                .Select(p => p.FilePath)
                .FirstOrDefaultAsync();

            return photo;
        }

        public async Task ArchiveContractorAsync(int id, string archivedBy = "Unknown")
        {
            var contractor = await _context.Contractors
                .Include(c => c.Passes)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (contractor == null)
            {
                throw new KeyNotFoundException($"Контрагент с ID {id} не найден.");
            }
            if (contractor.IsArchived)
            {
                throw new InvalidOperationException("Контрагент уже заархивирован.");
            }

            contractor.IsArchived = true;
            await SaveChangesAsync();

            var changes = new Dictionary<string, ChangeValueDto>
            {
                { "isArchived", new ChangeValueDto { OldValue = false, NewValue = true } }
            };

            var historyEntry = new History
            {
                EntityType = "contractor",
                EntityId = id.ToString(),
                Action = "archive",
                Details = $"Контрагент с ID {id} заархивирован.",
                ChangesJson = JsonSerializer.Serialize(changes, _jsonOptions),
                ChangedBy = archivedBy,
                ChangedAt = DateTime.UtcNow
            };
            await _historyService.LogHistoryAsync(historyEntry);
        }

        public async Task UnarchiveContractorAsync(int id, string unarchivedBy = "Unknown")
        {
            var contractor = await _context.Contractors.FirstOrDefaultAsync(c => c.Id == id);
            if (contractor == null)
            {
                throw new KeyNotFoundException($"Контрагент с ID {id} не найден.");
            }
            if (!contractor.IsArchived)
            {
                throw new InvalidOperationException("Контрагент уже разархивирован.");
            }

            contractor.IsArchived = false;
            await SaveChangesAsync();

            var changes = new Dictionary<string, ChangeValueDto>
            {
                { "isArchived", new ChangeValueDto { OldValue = true, NewValue = false } }
            };

            var historyEntry = new History
            {
                EntityType = "contractor",
                EntityId = id.ToString(),
                Action = "unarchive",
                Details = $"Контрагент с ID {id} разархивирован.",
                ChangesJson = JsonSerializer.Serialize(changes, _jsonOptions),
                ChangedBy = unarchivedBy,
                ChangedAt = DateTime.UtcNow
            };
            await _historyService.LogHistoryAsync(historyEntry);
        }

        public async Task UpdateNoteAsync(int id, string? note, string? updatedBy = null)
        {
            _logger.LogInformation("Попытка обновления заметки для контрагента с ID {Id}", id);
            var contractor = await _context.Contractors.FirstOrDefaultAsync(c => c.Id == id);
            if (contractor == null)
            {
                _logger.LogWarning("Контрагент с ID {Id} не найден.", id);
                throw new KeyNotFoundException($"Контрагент с ID {id} не найден.");
            }

            if (note != null && note.Length > 500)
            {
                _logger.LogWarning("Заметка для контрагента с ID {Id} превышает 500 символов.", id);
                throw new ArgumentException("Заметка не должна превышать 500 символов.");
            }

            var oldNote = contractor.Note;
            contractor.Note = note;
            await SaveChangesAsync();

            var changes = new Dictionary<string, ChangeValueDto>
    {
        { "note", new ChangeValueDto { OldValue = oldNote ?? "не указано", NewValue = note ?? "не указано" } }
    };

            var historyEntry = new History
            {
                EntityType = "contractor",
                EntityId = id.ToString(),
                Action = "update_note",
                Details = $"Заметка для контрагента с ID {id} обновлена.",
                ChangesJson = JsonSerializer.Serialize(changes, _jsonOptions),
                ChangedBy = updatedBy ?? "Unknown",
                ChangedAt = DateTime.UtcNow
            };
            await _historyService.LogHistoryAsync(historyEntry);

            _logger.LogInformation("Заметка для контрагента с ID {Id} успешно обновлена, история изменений записана.", id);
        }

        private Dictionary<string, ChangeValueDto> CompareContractors(Contractor? original, Contractor updated)
        {
            var changes = new Dictionary<string, ChangeValueDto>();

            if (original == null)
                return changes;

            if (original.FirstName != updated.FirstName)
            {
                var change = new ChangeValueDto { OldValue = original.FirstName, NewValue = updated.FirstName };
                changes.Add("firstName", change);
                _logger.LogInformation("Изменение firstName: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.LastName != updated.LastName)
            {
                var change = new ChangeValueDto { OldValue = original.LastName, NewValue = updated.LastName };
                changes.Add("lastName", change);
                _logger.LogInformation("Изменение lastName: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.MiddleName != updated.MiddleName)
            {
                var change = new ChangeValueDto { OldValue = original.MiddleName, NewValue = updated.MiddleName };
                changes.Add("middleName", change);
                _logger.LogInformation("Изменение middleName: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.Citizenship != updated.Citizenship)
            {
                var change = new ChangeValueDto { OldValue = original.Citizenship, NewValue = updated.Citizenship };
                changes.Add("citizenship", change);
                _logger.LogInformation("Изменение citizenship: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.Nationality != updated.Nationality)
            {
                var change = new ChangeValueDto { OldValue = original.Nationality, NewValue = updated.Nationality };
                changes.Add("nationality", change);
                _logger.LogInformation("Изменение nationality: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.BirthDate != updated.BirthDate)
            {
                var change = new ChangeValueDto { OldValue = original.BirthDate, NewValue = updated.BirthDate };
                changes.Add("birthDate", change);
                _logger.LogInformation("Изменение birthDate: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.DocumentType != updated.DocumentType)
            {
                var change = new ChangeValueDto { OldValue = original.DocumentType, NewValue = updated.DocumentType };
                changes.Add("documentType", change);
                _logger.LogInformation("Изменение documentType: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.PassportSerialNumber != updated.PassportSerialNumber)
            {
                var change = new ChangeValueDto { OldValue = original.PassportSerialNumber, NewValue = updated.PassportSerialNumber };
                changes.Add("passportSerialNumber", change);
                _logger.LogInformation("Изменение passportSerialNumber: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.PassportIssuedBy != updated.PassportIssuedBy)
            {
                var change = new ChangeValueDto { OldValue = original.PassportIssuedBy, NewValue = updated.PassportIssuedBy };
                changes.Add("passportIssuedBy", change);
                _logger.LogInformation("Изменение passportIssuedBy: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.PassportIssueDate != updated.PassportIssueDate)
            {
                var change = new ChangeValueDto { OldValue = original.PassportIssueDate, NewValue = updated.PassportIssueDate };
                changes.Add("passportIssueDate", change);
                _logger.LogInformation("Изменение passportIssueDate: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.PhoneNumber != updated.PhoneNumber)
            {
                var change = new ChangeValueDto { OldValue = original.PhoneNumber, NewValue = updated.PhoneNumber };
                changes.Add("phoneNumber", change);
                _logger.LogInformation("Изменение phoneNumber: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.ProductType != updated.ProductType)
            {
                var change = new ChangeValueDto { OldValue = original.ProductType, NewValue = updated.ProductType };
                changes.Add("productType", change);
                _logger.LogInformation("Изменение productType: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.IsArchived != updated.IsArchived)
            {
                var change = new ChangeValueDto { OldValue = original.IsArchived, NewValue = updated.IsArchived };
                changes.Add("isArchived", change);
                _logger.LogInformation("Изменение isArchived: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.SortOrder != updated.SortOrder)
            {
                var change = new ChangeValueDto { OldValue = original.SortOrder, NewValue = updated.SortOrder };
                changes.Add("sortOrder", change);
                _logger.LogInformation("Изменение sortOrder: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            if (original.Note != updated.Note)
            {
                var change = new ChangeValueDto { OldValue = original.Note, NewValue = updated.Note };
                changes.Add("note", change);
                _logger.LogInformation("Изменение note: oldValue={OldValue}, newValue={NewValue}", change.OldValue, change.NewValue);
            }

            return changes;
        }
    }
}