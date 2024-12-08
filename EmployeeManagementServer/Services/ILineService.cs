using EmployeeManagementServer.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface ILineService
    {
        Task<int> GetTotalLinesCountAsync();
        Task<List<Line>> GetLinesAsync(int skip, int pageSize);
        Task<Line> GetLineByIdAsync(int id);
        Task<Line> AddLineAsync(Line line);
        Task<bool?> UpdateLineAsync(int id, string newName, int? sortOrder);
        Task<bool> ArchiveLineAsync(int id);
    }
}
