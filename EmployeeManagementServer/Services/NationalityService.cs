using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace EmployeeManagementServer.Services
{
    public class NationalityService : INationalityService
    {
        private readonly ApplicationDbContext _context;

        public NationalityService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalNationalitiesCountAsync()
        {
            return await _context.Nationalities.CountAsync(b => !b.IsArchived);
        }

        public async Task<List<Nationality>> GetNationalitiesAsync(int skip, int pageSize)
        {
            return await _context.Nationalities
                .Where(b => !b.IsArchived)
                .OrderBy(b => b.SortOrder ?? b.Id) // Сортировка по SortOrder или Id
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Nationality> GetNationalityByIdAsync(int id)
        {
            return await _context.Nationalities.FirstOrDefaultAsync(b => b.Id == id && !b.IsArchived);
        }

        public async Task<Nationality> AddNationalityAsync(Nationality nationality)
        {
            nationality.Name = NormalizeName(nationality.Name);

            // Проверка на дублирование имени
            if (await _context.Nationalities.AnyAsync(b => b.Name == nationality.Name && !b.IsArchived))
            {
                return null;
            }

            _context.Nationalities.Add(nationality);
            await _context.SaveChangesAsync();

            // Если SortOrder не указан, назначаем его равным Id
            if (!nationality.SortOrder.HasValue)
            {
                nationality.SortOrder = nationality.Id;
                _context.Nationalities.Update(nationality);
                await _context.SaveChangesAsync();
            }

            return nationality;
        }

        public async Task<bool?> UpdateNationalityAsync(int id, string newName, int? sortOrder)
        {
            newName = NormalizeName(newName);

            var nationality = await _context.Nationalities.FindAsync(id);
            if (nationality == null || nationality.IsArchived)
            {
                return null;
            }

            // Проверка на уникальность имени
            if (await _context.Nationalities.AnyAsync(b => b.Name == newName && b.Id != id))
            {
                return false;
            }

            // Проверка на дублирование SortOrder
            if (sortOrder.HasValue && await _context.Nationalities.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Национальность с таким значением SortOrder уже существует.");
            }

            nationality.Name = newName;
            nationality.SortOrder = sortOrder ?? nationality.SortOrder;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ArchiveNationalityAsync(int id)
        {
            var nationality = await _context.Nationalities.FindAsync(id);
            if (nationality == null || nationality.IsArchived)
            {
                return false;
            }

            nationality.IsArchived = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private string NormalizeName(string name)
        {
            return name?.Trim();
        }
    }
}
