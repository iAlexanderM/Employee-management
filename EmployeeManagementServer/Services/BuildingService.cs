using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;

namespace EmployeeManagementServer.Services
{
    public class BuildingService : IBuildingService
    {
        private readonly ApplicationDbContext _context;

        public BuildingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalBuildingsCountAsync(bool? isArchived = null)
        {
            var query = _context.Buildings.AsQueryable();

            if (isArchived.HasValue)
            {
                query = query.Where(b => b.IsArchived == isArchived.Value);
            }

            return await query.CountAsync();
        }

        public async Task<List<Building>> GetBuildingsAsync(int skip, int pageSize, bool? isArchived = null)
        {
            var query = _context.Buildings.AsQueryable();

            if (isArchived.HasValue)
            {
                query = query.Where(b => b.IsArchived == isArchived.Value);
            }

            return await query
                .OrderBy(b => b.SortOrder == null ? 1 : 0)
                .ThenBy(b => b.SortOrder ?? int.MaxValue)
                .ThenBy(b => b.Id)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Building> GetBuildingByIdAsync(int id)
        {
            return await _context.Buildings.FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<Building> AddBuildingAsync(Building building)
        {
            building.Name = NormalizeName(building.Name);

            if (await _context.Buildings.AnyAsync(b => b.Name == building.Name && !b.IsArchived))
            {
                return null;
            }

            _context.Buildings.Add(building);
            await _context.SaveChangesAsync();

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
            if (building == null)
            {
                return null;
            }

            if (await _context.Buildings.AnyAsync(b => b.Name == newName && b.Id != id && !b.IsArchived))
            {
                return false;
            }

            if (sortOrder.HasValue && await _context.Buildings.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Здание с таким значением SortOrder уже существует.");
            }

            building.Name = newName;
            building.SortOrder = sortOrder ?? building.SortOrder;

            _context.Entry(building).Property(b => b.CreatedAt).IsModified = false;
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