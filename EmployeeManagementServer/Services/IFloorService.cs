using EmployeeManagementServer.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IFloorService
    {
        Task<int> GetTotalFloorsCountAsync(bool? isArchived = null);
        Task<List<Floor>> GetFloorsAsync(int skip, int pageSize, bool? isArchived = null);
        Task<Floor> GetFloorByIdAsync(int id);
        Task<Floor> AddFloorAsync(Floor floor);
        Task<bool?> UpdateFloorAsync(int id, string newName, int? sortOrder);
        Task<bool> ArchiveFloorAsync(int id);
    }
}
