using EmployeeManagementServer.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface ICitizenshipService
    {
        Task<int> GetTotalCitizenshipsCountAsync();
        Task<List<Citizenship>> GetCitizenshipsAsync(int skip, int pageSize);
        Task<Citizenship> GetCitizenshipByIdAsync(int id);
        Task<Citizenship> AddCitizenshipAsync(Citizenship citizenship);
        Task<bool?> UpdateCitizenshipAsync(int id, string newName, int? sortOrder);
        Task<bool> ArchiveCitizenshipAsync(int id);
    }
}
