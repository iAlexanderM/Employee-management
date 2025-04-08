using EmployeeManagementServer.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IPositionService
    {
        Task<int> GetTotalPositionsCountAsync();
        Task<List<Position>> GetPositionsAsync(int skip, int pageSize);
        Task<Position> GetPositionByIdAsync(int id);
        Task<Position> AddPositionAsync(Position position);
        Task<bool?> UpdatePositionAsync(int id, string newName, int? sortOrder);
        Task<bool> ArchivePositionAsync(int id);
    }
}
