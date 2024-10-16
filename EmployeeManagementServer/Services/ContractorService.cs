using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;

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

                // Удаление старых фотографий
                await RemovePhotosAsync(contractor, deletedPhotoIds);

                _logger.LogInformation("Старые фотографии успешно удалены для контрагента с ID {Id}", contractor.Id);

                // Добавление новых фотографий
                await AddPhotosAsync(contractor, newPhotos, false);
                await AddPhotosAsync(contractor, newDocumentPhotos, true);

                _logger.LogInformation("Новые фотографии успешно добавлены для контрагента с ID {Id}", contractor.Id);

                // Обновление данных контрагента в базе данных
                _context.Contractors.Update(contractor);
                await SaveChangesAsync();

                _logger.LogInformation("Изменения для контрагента с ID {Id} успешно сохранены в базе данных.", contractor.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении контрагента с ID {Id}.", contractor.Id);
                throw; // Перебрасываем исключение для обработки на уровне контроллера
            }
        }


        private async Task RemovePhotosAsync(Contractor contractor, List<int> photoIds)
        {
            if (photoIds == null || !photoIds.Any()) return;

            var photosToDelete = contractor.Photos
                .Where(photo => photoIds.Contains(photo.Id))
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
