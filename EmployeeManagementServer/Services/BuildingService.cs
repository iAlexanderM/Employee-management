using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace EmployeeManagementServer.Services
{
    public class BuildingService : IBuildingService
    {
        private readonly ApplicationDbContext _context;

        public BuildingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalBuildingsCountAsync()
        {
            return await _context.Buildings.CountAsync(b => !b.IsArchived);
        }

        public async Task<List<Building>> GetBuildingsAsync(int skip, int pageSize)
        {
            return await _context.Buildings
                .Where(b => !b.IsArchived)
                .OrderBy(b => b.SortOrder ?? b.Id) // Сортировка по SortOrder или Id
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Building> GetBuildingByIdAsync(int id)
        {
            return await _context.Buildings.FirstOrDefaultAsync(b => b.Id == id && !b.IsArchived);
        }

        public async Task<Building> AddBuildingAsync(Building building)
        {
            building.Name = NormalizeName(building.Name);

            // Проверка на дублирование имени
            if (await _context.Buildings.AnyAsync(b => b.Name == building.Name && !b.IsArchived))
            {
                return null;
            }

            _context.Buildings.Add(building);
            await _context.SaveChangesAsync();

            // Если SortOrder не указан, назначаем его равным Id
            if (!building.SortOrder.HasValue)
            {
                building.SortOrder = building.Id;
                _context.Buildings.Update(building);
                await _context.SaveChangesAsync();
            }

            return building;
        }

        public async Task<bool?> UpdateBuildingAsync(int id, string newName, int? sortOrder)
        {
            newName = NormalizeName(newName);

            var building = await _context.Buildings.FindAsync(id);
            if (building == null || building.IsArchived)
            {
                return null;
            }

            // Проверка на уникальность имени
            if (await _context.Buildings.AnyAsync(b => b.Name == newName && b.Id != id))
            {
                return false;
            }

            // Проверка на дублирование SortOrder
            if (sortOrder.HasValue && await _context.Buildings.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Здание с таким значением SortOrder уже существует.");
            }

            building.Name = newName;
            building.SortOrder = sortOrder ?? building.SortOrder;

            _context.Entry(building).Property(b => b.CreatedAt).IsModified = false; // Сохраняем дату создания
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ArchiveBuildingAsync(int id)
        {
            var building = await _context.Buildings.FindAsync(id);
            if (building == null || building.IsArchived)
            {
                return false;
            }

            building.IsArchived = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private string NormalizeName(string name)
        {
            return name?.Trim();
        }
    }
}
