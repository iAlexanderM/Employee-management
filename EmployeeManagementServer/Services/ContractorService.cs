using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using System.IO;

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

        // Метод для обновления контрагента, включающий добавление и удаление фотографий
        public async Task UpdateContractorAsync(
            Contractor contractor,
            List<IFormFile> newPhotos,
            List<IFormFile> newDocumentPhotos,
            List<int> deletedPhotoIds,
            List<int> deletedDocumentPhotoIds)
        {
            // Удаление старых фотографий
            await RemovePhotosAsync(contractor, deletedPhotoIds, false);
            await RemovePhotosAsync(contractor, deletedDocumentPhotoIds, true);

            // Добавление новых фотографий
            await AddPhotosAsync(contractor, newPhotos, false);
            await AddPhotosAsync(contractor, newDocumentPhotos, true);

            // Обновление данных контрагента в базе данных
            _context.Contractors.Update(contractor);
            await SaveChangesAsync();
        }

        // Метод для удаления фотографий
        private async Task RemovePhotosAsync(Contractor contractor, List<int> photoIds, bool isDocumentPhoto)
        {
            if (photoIds == null || !photoIds.Any()) return;

            var photosToDelete = contractor.Photos
                .Where(photo => photoIds.Contains(photo.Id) && photo.IsDocumentPhoto == isDocumentPhoto)
                .ToList();

            // Удаление файлов с диска
            foreach (var photo in photosToDelete)
            {
                if (File.Exists(photo.FilePath))
                {
                    File.Delete(photo.FilePath);
                }
            }

            _context.ContractorPhoto.RemoveRange(photosToDelete);
        }

        // Метод для добавления новых фотографий
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

        // Метод для сохранения фотографий
        public async Task<string> SavePhotoAsync(IFormFile photo, bool isDocumentPhoto)
        {
            var folder = isDocumentPhoto ? Path.Combine("wwwroot", "uploads", "documents") : Path.Combine("wwwroot", "uploads", "photos");
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(photo.FileName);
            var filePath = Path.Combine(folder, uniqueFileName);

            // Проверяем, существует ли директория, и создаём её при необходимости
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

        // Получение всех контрагентов
        public async Task<List<Contractor>> GetAllContractorsAsync()
        {
            return await _context.Contractors
                .Include(c => c.Photos)
                .ToListAsync();
        }

        // Получение контрагента по идентификатору
        public async Task<Contractor?> GetContractorByIdAsync(int id)
        {
            return await _context.Contractors
                .Include(c => c.Photos)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        // Создание нового контрагента
        public async Task CreateContractorAsync(Contractor contractor)
        {
            _context.Contractors.Add(contractor);
            await SaveChangesAsync();
        }

        // Поиск контрагента по номеру паспорта
        public async Task<Contractor?> FindContractorByPassportSerialNumberAsync(string passportSerialNumber)
        {
            return await _context.Contractors
                .Include(c => c.Photos)
                .FirstOrDefaultAsync(c => c.PassportSerialNumber == passportSerialNumber);
        }
    }
}
