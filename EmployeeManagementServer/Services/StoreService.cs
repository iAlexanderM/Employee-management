using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementServer.Services
{
    public class StoreService : IStoreService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StoreService> _logger;

        public StoreService(ApplicationDbContext context, ILogger<StoreService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> GetTotalStoresCountAsync(string building, string floor, string line, string storeNumber)
        {
            var query = _context.Stores.AsQueryable();

            // Применяем фильтры
            if (!string.IsNullOrEmpty(building))
            {
                query = query.Where(s => s.Building.Trim() == building.Trim());
            }
            if (!string.IsNullOrEmpty(floor))
            {
                query = query.Where(s => s.Floor.Trim() == floor.Trim());
            }
            if (!string.IsNullOrEmpty(line))
            {
                query = query.Where(s => s.Line.Trim() == line.Trim());
            }
            if (!string.IsNullOrEmpty(storeNumber))
            {
                query = query.Where(s => s.StoreNumber.Trim() == storeNumber.Trim());
            }

            return await query.CountAsync();
        }

        public async Task<List<Store>> GetAllStoresAsync(int skip, int pageSize, string building, string floor, string line, string storeNumber)
        {
            var query = _context.Stores.AsQueryable();

            // Применяем фильтры
            if (!string.IsNullOrEmpty(building))
            {
                query = query.Where(s => s.Building.Trim() == building.Trim());
            }
            if (!string.IsNullOrEmpty(floor))
            {
                query = query.Where(s => s.Floor.Trim() == floor.Trim());
            }
            if (!string.IsNullOrEmpty(line))
            {
                query = query.Where(s => s.Line.Trim() == line.Trim());
            }
            if (!string.IsNullOrEmpty(storeNumber))
            {
                query = query.Where(s => s.StoreNumber.Trim() == storeNumber.Trim());
            }

            // Применяем сортировку, пропуск и лимит
            return await query
                .OrderBy(s => s.Id) // Убедитесь, что есть сортировка для стабильного результата
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
        }


        public async Task<Store> GetStoreByIdAsync(int id)
        {
            return await _context.Stores
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsArchived);
        }

        public async Task<Store> AddStoreAsync(Store store)
        {
            // Проверка на дублирование
            if (await _context.Stores.AnyAsync(s =>
                s.Building == store.Building &&
                s.Line == store.Line &&
                s.Floor == store.Floor &&
                s.StoreNumber == store.StoreNumber))
            {
                return null;
            }

            // Добавляем торговую точку в базу, чтобы получить ID
            _context.Stores.Add(store);
            await _context.SaveChangesAsync();

            // Если SortOrder равен 0, то назначаем его равным Id
            if (store.SortOrder == 0)
            {
                store.SortOrder = store.Id;

                // Обновляем значение SortOrder
                _context.Stores.Update(store);
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Добавлена новая торговая точка с ID: {StoreId}, SortOrder: {SortOrder}", store.Id, store.SortOrder);

            return store;
        }

        public async Task<bool?> UpdateStoreAsync(int id, string newBuilding, string newFloor, string newLine, string newStoreNumber, int? sortOrder)
        {
            var store = await _context.Stores.FindAsync(id);
            if (store == null || store.IsArchived)
                return null;

            // Проверка на изменения данных
            if (store.Building == newBuilding && store.Floor == newFloor &&
                store.Line == newLine && store.StoreNumber == newStoreNumber &&
                (!sortOrder.HasValue || store.SortOrder == sortOrder))
            {
                throw new InvalidOperationException("Изменений не обнаружено.");
            }

            // Проверка на дублирование точки
            if (await _context.Stores.AnyAsync(s =>
                s.Id != id &&
                s.Building == newBuilding &&
                s.Line == newLine &&
                s.Floor == newFloor &&
                s.StoreNumber == newStoreNumber))
            {
                throw new InvalidOperationException("Точка с такими данными уже существует.");
            }

            // Проверка на дублирование сортировки
            if (sortOrder.HasValue && await _context.Stores.AnyAsync(s => s.SortOrder == sortOrder && s.Id != id))
            {
                throw new InvalidOperationException("Точка с таким значением сортировки уже существует.");
            }

            // Обновляем данные
            store.Building = newBuilding;
            store.Floor = newFloor;
            store.Line = newLine;
            store.StoreNumber = newStoreNumber;
            store.SortOrder = sortOrder ?? store.SortOrder;

            _context.Entry(store).Property(s => s.CreatedAt).IsModified = false;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ArchiveStoreAsync(int id)
        {
            var store = await _context.Stores.FindAsync(id);
            if (store == null || store.IsArchived)
                return false;

            store.IsArchived = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnarchiveStoreAsync(int id)
        {
            var store = await _context.Stores.FindAsync(id);
            if (store == null || !store.IsArchived)
                return false;

            store.IsArchived = false;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
