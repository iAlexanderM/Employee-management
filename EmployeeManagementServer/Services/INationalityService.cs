using EmployeeManagementServer.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface INationalityService
    {
        Task<int> GetTotalNationalitiesCountAsync();
        Task<List<Nationality>> GetNationalitiesAsync(int skip, int pageSize);
        Task<Nationality> GetNationalityByIdAsync(int id);
        Task<Nationality> AddNationalityAsync(Nationality nationality);
        Task<bool?> UpdateNationalityAsync(int id, string newName, int? sortOrder);
        Task<bool> ArchiveNationalityAsync(int id);
    }
}
