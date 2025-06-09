using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace EmployeeManagementServer.Services
{
    public class CitizenshipService : ICitizenshipService
    {
        private readonly ApplicationDbContext _context;

        public CitizenshipService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalCitizenshipsCountAsync()
        {
            return await _context.Citizenships.CountAsync(b => !b.IsArchived);
        }

        public async Task<List<Citizenship>> GetCitizenshipsAsync(int skip, int pageSize)
        {
            return await _context.Citizenships
                .Where(b => !b.IsArchived)
                .OrderBy(b => b.SortOrder ?? b.Id) 
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Citizenship> GetCitizenshipByIdAsync(int id)
        {
            return await _context.Citizenships.FirstOrDefaultAsync(b => b.Id == id && !b.IsArchived);
        }

        public async Task<Citizenship> AddCitizenshipAsync(Citizenship citizenship)
        {
            citizenship.Name = NormalizeName(citizenship.Name);

            if (await _context.Citizenships.AnyAsync(b => b.Name == citizenship.Name && !b.IsArchived))
            {
                return null;
            }

            _context.Citizenships.Add(citizenship);
            await _context.SaveChangesAsync();

            if (!citizenship.SortOrder.HasValue)
            {
                citizenship.SortOrder = citizenship.Id;
                _context.Citizenships.Update(citizenship);
                await _context.SaveChangesAsync();
            }

            return citizenship;
        }

        public async Task<bool?> UpdateCitizenshipAsync(int id, string newName, int? sortOrder)
        {
            newName = NormalizeName(newName);

            var citizenship = await _context.Citizenships.FindAsync(id);
            if (citizenship == null || citizenship.IsArchived)
            {
                return null;
            }

            if (await _context.Citizenships.AnyAsync(b => b.Name == newName && b.Id != id))
            {
                return false;
            }

            if (sortOrder.HasValue && await _context.Citizenships.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Гражданство с таким значением SortOrder уже существует.");
            }

            citizenship.Name = newName;
            citizenship.SortOrder = sortOrder ?? citizenship.SortOrder;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ArchiveCitizenshipAsync(int id)
        {
            var citizenship = await _context.Citizenships.FindAsync(id);
            if (citizenship == null || citizenship.IsArchived)
            {
                return false;
            }

            citizenship.IsArchived = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private string NormalizeName(string name)
        {
            return name?.Trim();
        }
    }
}
