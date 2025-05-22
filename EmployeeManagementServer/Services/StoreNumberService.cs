using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;

namespace EmployeeManagementServer.Services
{
    public class StoreNumberService : IStoreNumberService
    {
        private readonly ApplicationDbContext _context;

        public StoreNumberService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalStoreNumbersCountAsync(bool? isArchived = null)
        {
            var query = _context.StoreNumbers.AsQueryable();

            if (isArchived.HasValue)
            {
                query = query.Where(b => b.IsArchived == isArchived.Value);
            }

            return await query.CountAsync();
        }

        public async Task<List<StoreNumber>> GetStoreNumbersAsync(int skip, int pageSize, bool? isArchived = null)
        {
            var query = _context.StoreNumbers.AsQueryable();

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

        public async Task<StoreNumber> GetStoreNumberByIdAsync(int id)
        {
            return await _context.StoreNumbers.FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<StoreNumber> AddStoreNumberAsync(StoreNumber storeNumber)
        {
            storeNumber.Name = NormalizeName(storeNumber.Name);

            if (await _context.StoreNumbers.AnyAsync(b => b.Name == storeNumber.Name && !b.IsArchived))
            {
                return null;
            }

            _context.StoreNumbers.Add(storeNumber);
            await _context.SaveChangesAsync();

            if (!storeNumber.SortOrder.HasValue)
            {
                storeNumber.SortOrder = storeNumber.Id;
                _context.StoreNumbers.Update(storeNumber);
                await _context.SaveChangesAsync();
            }

            return storeNumber;
        }

        public async Task<bool?> UpdateStoreNumberAsync(int id, string newName, int? sortOrder)
        {
            newName = NormalizeName(newName);

            var storeNumber = await _context.StoreNumbers.FindAsync(id);
            if (storeNumber == null)
            {
                return null;
            }

            if (await _context.StoreNumbers.AnyAsync(b => b.Name == newName && b.Id != id && !b.IsArchived))
            {
                return false;
            }

            if (sortOrder.HasValue && await _context.StoreNumbers.AnyAsync(b => b.SortOrder == sortOrder && b.Id != id))
            {
                throw new InvalidOperationException("Точка с таким значением SortOrder уже существует.");
            }

            storeNumber.Name = newName;
            storeNumber.SortOrder = sortOrder ?? storeNumber.SortOrder;

            _context.Entry(storeNumber).Property(b => b.CreatedAt).IsModified = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ArchiveStoreNumberAsync(int id)
        {
            var storeNumber = await _context.StoreNumbers.FindAsync(id);
            if (storeNumber == null || storeNumber.IsArchived)
            {
                return false;
            }

            storeNumber.IsArchived = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private string NormalizeName(string name)
        {
            return name?.Trim();
        }
    }
}