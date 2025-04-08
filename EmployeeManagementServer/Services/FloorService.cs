using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace EmployeeManagementServer.Services
{
    public class FloorService : IFloorService
    {
        private readonly ApplicationDbContext _context;

        public FloorService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalFloorsCountAsync()
        {
            return await _context.Floors.CountAsync(b => !b.IsArchived);
        }

        public async Task<List<Floor>> GetFloorsAsync(int skip, int pageSize)
        {
            return await _context.Floors
                .Where(b => !b.IsArchived)
                .OrderBy(b => b.SortOrder ?? b.Id) // Сортировка по SortOrder или Id
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Floor> GetFloorByIdAsync(int id)
        {
            return await _context.Floors.FirstOrDefaultAsync(b => b.Id == id && !b.IsArchived);
        }

        public async Task<Floor> AddFloorAsync(Floor floor)
        {
            floor.Name = NormalizeName(floor.Name);

            // Проверка на дублирование имени
            if (await _context.Floors.AnyAsync(b => b.Name == floor.Name && !b.IsArchived))
            {
                return null;
            }

            _context.Floors.Add(floor);
            await _context.SaveChangesAsync();

            // Если SortOrder не указан, назначаем его равным Id
            if (!floor.SortOrder.HasValue)
            {
                floor.SortOrder = floor.Id;
                _context.Floors.Update(floor);
                await _context.SaveChangesAsync();
            }

            return floor;
        }

        public async Task<bool?> UpdateFloorAsync(int id, string newName, int? sortOrder)
        {
            newName = NormalizeName(newName);

            var floor = await _context.Floors.FindAsync(id);
            if (floor == null || floor.IsArchived)
            {
                return null;
            }

            // Проверка на уникальность имени
            if (await _context.Floors.AnyAsync(b => b.Name == newName && b.Id != id))
            {
                return false;
            }

            // Проверка на дублирование SortOrder
            if (sortOrder.HasValue && await _context.Floors.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Этаж с таким значением SortOrder уже существует.");
            }

            floor.Name = newName;
            floor.SortOrder = sortOrder ?? floor.SortOrder;

            _context.Entry(floor).Property(b => b.CreatedAt).IsModified = false; // Сохраняем дату создания
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ArchiveFloorAsync(int id)
        {
            var floor = await _context.Floors.FindAsync(id);
            if (floor == null || floor.IsArchived)
            {
                return false;
            }

            floor.IsArchived = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private string NormalizeName(string name)
        {
            return name?.Trim();
        }
    }
}
