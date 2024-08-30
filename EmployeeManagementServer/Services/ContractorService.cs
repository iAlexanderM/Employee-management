using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IContractorService
    {
        Task<IEnumerable<Contractor>> GetAllContractorsAsync();
        Task<Contractor> GetContractorByIdAsync(int id);
        Task AddContractorAsync(Contractor contractor);
        Task UpdateContractorAsync(Contractor contractor);
        Task ArchiveContractorAsync(Contractor contractor);
    }

    public class ContractorService : IContractorService
    {
        private readonly ApplicationDbContext _context;

        public ContractorService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Contractor>> GetAllContractorsAsync()
        {
            return await _context.Contractors.Include(c => c.Photos).Where(c => !c.IsArchived).ToListAsync();
        }

        public async Task<Contractor> GetContractorByIdAsync(int id)
        {
            return await _context.Contractors.Include(c => c.Photos).FirstOrDefaultAsync(c => c.Id == id && !c.IsArchived);
        }

        public async Task AddContractorAsync(Contractor contractor)
        {
            _context.Contractors.Add(contractor);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateContractorAsync(Contractor contractor)
        {
            _context.Contractors.Update(contractor);
            await _context.SaveChangesAsync();
        }

        public async Task ArchiveContractorAsync(Contractor contractor)
        {
            contractor.IsArchived = true;
            _context.Contractors.Update(contractor);
            await _context.SaveChangesAsync();
        }
    }
}
