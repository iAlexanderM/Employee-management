using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;

namespace EmployeeManagementServer.Services
{
    public class LineService : ILineService
    {
        private readonly ApplicationDbContext _context;

        public LineService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalLinesCountAsync(bool? isArchived = null)
        {
            var query = _context.Lines.AsQueryable();

            if (isArchived.HasValue)
            {
                query = query.Where(b => b.IsArchived == isArchived.Value);
            }

            return await query.CountAsync();
        }

        public async Task<List<Line>> GetLinesAsync(int skip, int pageSize, bool? isArchived = null)
        {
            var query = _context.Lines.AsQueryable();

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

        public async Task<Line> GetLineByIdAsync(int id)
        {
            return await _context.Lines.FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<Line> AddLineAsync(Line line)
        {
            line.Name = NormalizeName(line.Name);

            if (await _context.Lines.AnyAsync(b => b.Name == line.Name && !b.IsArchived))
            {
                return null;
            }

            _context.Lines.Add(line);
            await _context.SaveChangesAsync();

            if (!line.SortOrder.HasValue)
            {
                line.SortOrder = line.Id;
                _context.Lines.Update(line);
                await _context.SaveChangesAsync();
            }

            return line;
        }

        public async Task<bool?> UpdateLineAsync(int id, string newName, int? sortOrder)
        {
            newName = NormalizeName(newName);

            var line = await _context.Lines.FindAsync(id);
            if (line == null)
            {
                return null;
            }

            if (await _context.Lines.AnyAsync(b => b.Name == newName && b.Id != id && !b.IsArchived))
            {
                return false;
            }

            if (sortOrder.HasValue && await _context.Lines.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Линия с таким значением SortOrder уже существует.");
            }

            line.Name = newName;
            line.SortOrder = sortOrder ?? line.SortOrder;

            _context.Entry(line).Property(b => b.CreatedAt).IsModified = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ArchiveLineAsync(int id)
        {
            var line = await _context.Lines.FindAsync(id);
            if (line == null || line.IsArchived)
            {
                return false;
            }

            line.IsArchived = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private string NormalizeName(string name)
        {
            return name?.Trim();
        }
    }
}