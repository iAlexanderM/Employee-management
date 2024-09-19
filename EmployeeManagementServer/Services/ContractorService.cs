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

        public ContractorService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Получение всех контрагентов
        public async Task<List<Contractor>> GetAllContractorsAsync()
        {
            return await _context.Contractors
                .Include(c => c.Photos)  // Включаем связанные фотографии
                .ToListAsync();
        }

        // Получение контрагента по идентификатору
        public async Task<Contractor> GetContractorByIdAsync(int id)
        {
            return await _context.Contractors
                .Include(c => c.Photos)  // Включаем связанные фотографии
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        // Создание нового контрагента
        public async Task CreateContractorAsync(Contractor contractor)
        {
            _context.Contractors.Add(contractor);
            await _context.SaveChangesAsync();
        }

        // Поиск контрагента по номеру паспорта
        public async Task<Contractor> FindContractorByPassportSerialNumberAsync(string passportSerialNumber)
        {
            return await _context.Contractors
                .Include(c => c.Photos)  // Включаем связанные фотографии
                .FirstOrDefaultAsync(c => c.PassportSerialNumber == passportSerialNumber);
        }

        // Метод для добавления новых фотографий
        public async Task AddNewPhotosAsync(int contractorId, List<IFormFile> contractorPhotos, List<IFormFile> documentPhotos)
        {
            var contractor = await _context.Contractors
                .Include(c => c.Photos)
                .FirstOrDefaultAsync(c => c.Id == contractorId);

            if (contractor != null)
            {
                // Добавляем обычные фотографии
                if (contractorPhotos != null)
                {
                    foreach (var photo in contractorPhotos)
                    {
                        var photoPath = await SavePhoto(photo, false);  // Не документные фотографии
                        contractor.Photos.Add(new ContractorPhoto
                        {
                            FilePath = photoPath,
                            IsDocumentPhoto = false
                        });
                    }
                }

                // Добавляем фотографии документов
                if (documentPhotos != null)
                {
                    foreach (var docPhoto in documentPhotos)
                    {
                        var docPhotoPath = await SavePhoto(docPhoto, true);  // Документные фотографии
                        contractor.Photos.Add(new ContractorPhoto
                        {
                            FilePath = docPhotoPath,
                            IsDocumentPhoto = true
                        });
                    }
                }

                await _context.SaveChangesAsync();
            }
        }

        // Метод для сохранения фотографий
        public async Task<string> SavePhoto(IFormFile photo, bool isDocumentPhoto)
        {
            var folder = isDocumentPhoto ? "wwwroot/uploads/documents" : "wwwroot/uploads/photos";
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + photo.FileName;
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
    }
}
