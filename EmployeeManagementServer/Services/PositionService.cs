using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace EmployeeManagementServer.Services
{
    public class PositionService : IPositionService
    {
        private readonly ApplicationDbContext _context;

        public PositionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalPositionsCountAsync()
        {
            return await _context.Positions.CountAsync(b => !b.IsArchived);
        }

        public async Task<List<Position>> GetPositionsAsync(int skip, int pageSize)
        {
            return await _context.Positions
                .Where(b => !b.IsArchived)
                .OrderBy(b => b.SortOrder ?? b.Id)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Position> GetPositionByIdAsync(int id)
        {
            return await _context.Positions.FirstOrDefaultAsync(b => b.Id == id && !b.IsArchived);
        }

        public async Task<Position> AddPositionAsync(Position position)
        {
            position.Name = NormalizeName(position.Name);

            if (await _context.Positions.AnyAsync(b => b.Name == position.Name && !b.IsArchived))
            {
                return null;
            }

            _context.Positions.Add(position);
            await _context.SaveChangesAsync();

            if (!position.SortOrder.HasValue)
            {
                position.SortOrder = position.Id;
                _context.Positions.Update(position);
                await _context.SaveChangesAsync();
            }

            return position;
        }

        public async Task<bool?> UpdatePositionAsync(int id, string newName, int? sortOrder)
        {
            newName = NormalizeName(newName);

            var position = await _context.Positions.FindAsync(id);
            if (position == null || position.IsArchived)
            {
                return null;
            }

            if (await _context.Positions.AnyAsync(b => b.Name == newName && b.Id != id))
            {
                return false;
            }

            if (sortOrder.HasValue && await _context.Positions.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Должность с таким значением SortOrder уже существует.");
            }

            position.Name = newName;
            position.SortOrder = sortOrder ?? position.SortOrder;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ArchivePositionAsync(int id)
        {
            var position = await _context.Positions.FindAsync(id);
            if (position == null || position.IsArchived)
            {
                return false;
            }

            position.IsArchived = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private string NormalizeName(string name)
        {
            return name?.Trim();
        }
    }
}
