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
        Task AddContractorWithTransactionAsync(Contractor contractor);
        Task UpdateContractorAsync(Contractor contractor);
        Task ArchiveContractorAsync(Contractor contractor);
        Task<Contractor> FindContractorByPassportSerialNumberAsync(string passportSerialNumber);
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

        public async Task<Contractor> FindContractorByPassportSerialNumberAsync(string passportSerialNumber)
        {
            return await _context.Contractors.FirstOrDefaultAsync(c => c.PassportSerialNumber == passportSerialNumber);
        }

        public async Task<Contractor> GetContractorByIdAsync(int id)
        {
            return await _context.Contractors.Include(c => c.Photos).FirstOrDefaultAsync(c => c.Id == id && !c.IsArchived);
        }

        public async Task AddContractorWithTransactionAsync(Contractor contractor)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    contractor.BirthDate = contractor.BirthDate.ToUniversalTime();
                    contractor.PassportIssueDate = contractor.PassportIssueDate.ToUniversalTime();

                    _context.Contractors.Add(contractor);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
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
