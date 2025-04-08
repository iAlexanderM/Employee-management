using EmployeeManagementServer.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IFloorService
    {
        Task<int> GetTotalFloorsCountAsync();
        Task<List<Floor>> GetFloorsAsync(int skip, int pageSize);
        Task<Floor> GetFloorByIdAsync(int id);
        Task<Floor> AddFloorAsync(Floor floor);
        Task<bool?> UpdateFloorAsync(int id, string newName, int? sortOrder);
        Task<bool> ArchiveFloorAsync(int id);
    }
}
