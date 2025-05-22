using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;

namespace EmployeeManagementServer.Services
{
    public class FloorService : IFloorService
    {
        private readonly ApplicationDbContext _context;

        public FloorService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalFloorsCountAsync(bool? isArchived = null)
        {
            var query = _context.Floors.AsQueryable();

            if (isArchived.HasValue)
            {
                query = query.Where(b => b.IsArchived == isArchived.Value);
            }

            return await query.CountAsync();
        }

        public async Task<List<Floor>> GetFloorsAsync(int skip, int pageSize, bool? isArchived = null)
        {
            var query = _context.Floors.AsQueryable();

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

        public async Task<Floor> GetFloorByIdAsync(int id)
        {
            return await _context.Floors.FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<Floor> AddFloorAsync(Floor floor)
        {
            floor.Name = NormalizeName(floor.Name);

            if (await _context.Floors.AnyAsync(b => b.Name == floor.Name && !b.IsArchived))
            {
                return null;
            }

            _context.Floors.Add(floor);
            await _context.SaveChangesAsync();

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
            if (floor == null)
            {
                return null;
            }

            if (await _context.Floors.AnyAsync(b => b.Name == newName && b.Id != id && !b.IsArchived))
            {
                return false;
            }

            if (sortOrder.HasValue && await _context.Floors.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Этаж с таким значением SortOrder уже существует.");
            }

            floor.Name = newName;
            floor.SortOrder = sortOrder ?? floor.SortOrder;

            _context.Entry(floor).Property(b => b.CreatedAt).IsModified = false;
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