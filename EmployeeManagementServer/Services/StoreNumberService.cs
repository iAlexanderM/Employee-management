using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace EmployeeManagementServer.Services
{
    public class StoreNumberService : IStoreNumberService
    {
        private readonly ApplicationDbContext _context;

        public StoreNumberService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalStoreNumbersCountAsync()
        {
            return await _context.StoreNumbers.CountAsync(b => !b.IsArchived);
        }

        public async Task<List<StoreNumber>> GetStoreNumbersAsync(int skip, int pageSize)
        {
            return await _context.StoreNumbers
                .Where(b => !b.IsArchived)
                .OrderBy(b => b.SortOrder ?? b.Id) // Сортировка по SortOrder или Id
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<StoreNumber> GetStoreNumberByIdAsync(int id)
        {
            return await _context.StoreNumbers.FirstOrDefaultAsync(b => b.Id == id && !b.IsArchived);
        }

        public async Task<StoreNumber> AddStoreNumberAsync(StoreNumber storeNumber)
        {
            storeNumber.Name = NormalizeName(storeNumber.Name);

            // Проверка на дублирование имени
            if (await _context.StoreNumbers.AnyAsync(b => b.Name == storeNumber.Name && !b.IsArchived))
            {
                return null;
            }

            _context.StoreNumbers.Add(storeNumber);
            await _context.SaveChangesAsync();

            // Если SortOrder не указан, назначаем его равным Id
            if (!storeNumber.SortOrder.HasValue)
            {
                storeNumber.SortOrder = storeNumber.Id;
                _context.StoreNumbers.Update(storeNumber);
                await _context.SaveChangesAsync();
            }

            return storeNumber;
        }

        public async Task<bool?> UpdateStoreNumberAsync(int id, string newName, int? sortOrder)
        {
            newName = NormalizeName(newName);

            var storeNumber = await _context.StoreNumbers.FindAsync(id);
            if (storeNumber == null || storeNumber.IsArchived)
            {
                return null;
            }

            // Проверка на уникальность имени
            if (await _context.StoreNumbers.AnyAsync(b => b.Name == newName && b.Id != id))
            {
                return false;
            }

            // Проверка на дублирование SortOrder
            if (sortOrder.HasValue && await _context.StoreNumbers.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Точка с таким значением SortOrder уже существует.");
            }

            storeNumber.Name = newName;
            storeNumber.SortOrder = sortOrder ?? storeNumber.SortOrder;

            _context.Entry(storeNumber).Property(b => b.CreatedAt).IsModified = false; // Сохраняем дату создания
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ArchiveStoreNumberAsync(int id)
        {
            var storeNumber = await _context.StoreNumbers.FindAsync(id);
            if (storeNumber == null || storeNumber.IsArchived)
            {
                return false;
            }

            storeNumber.IsArchived = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private string NormalizeName(string name)
        {
            return name?.Trim();
        }
    }
}
