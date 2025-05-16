using EmployeeManagementServer.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IBuildingService
    {
        Task<int> GetTotalBuildingsCountAsync(bool? isArchived = null);
        Task<List<Building>> GetBuildingsAsync(int skip, int pageSize, bool? isArchived = null);
        Task<Building> GetBuildingByIdAsync(int id);
        Task<Building> AddBuildingAsync(Building building);
        Task<bool?> UpdateBuildingAsync(int id, string newName, int? sortOrder);
        Task<bool> ArchiveBuildingAsync(int id);
    }
}
