using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace EmployeeManagementServer.Services
{
    public class LineService : ILineService
    {
        private readonly ApplicationDbContext _context;

        public LineService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalLinesCountAsync()
        {
            return await _context.Lines.CountAsync(b => !b.IsArchived);
        }

        public async Task<List<Line>> GetLinesAsync(int skip, int pageSize)
        {
            return await _context.Lines
                .Where(b => !b.IsArchived)
                .OrderBy(b => b.SortOrder ?? b.Id) // Сортировка по SortOrder или Id
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Line> GetLineByIdAsync(int id)
        {
            return await _context.Lines.FirstOrDefaultAsync(b => b.Id == id && !b.IsArchived);
        }

        public async Task<Line> AddLineAsync(Line line)
        {
            line.Name = NormalizeName(line.Name);

            // Проверка на дублирование имени
            if (await _context.Lines.AnyAsync(b => b.Name == line.Name && !b.IsArchived))
            {
                return null;
            }

            _context.Lines.Add(line);
            await _context.SaveChangesAsync();

            // Если SortOrder не указан, назначаем его равным Id
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
            if (line == null || line.IsArchived)
            {
                return null;
            }

            // Проверка на уникальность имени
            if (await _context.Lines.AnyAsync(b => b.Name == newName && b.Id != id))
            {
                return false;
            }

            // Проверка на дублирование SortOrder
            if (sortOrder.HasValue && await _context.Lines.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Линия с таким значением SortOrder уже существует.");
            }

            line.Name = newName;
            line.SortOrder = sortOrder ?? line.SortOrder;

            _context.Entry(line).Property(b => b.CreatedAt).IsModified = false; // Сохраняем дату создания
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
