using EmployeeManagementServer.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface ILineService
    {
        Task<int> GetTotalLinesCountAsync(bool? isArchived = null);
        Task<List<Line>> GetLinesAsync(int skip, int pageSize, bool? isArchived = null);
        Task<Line> GetLineByIdAsync(int id);
        Task<Line> AddLineAsync(Line line);
        Task<bool?> UpdateLineAsync(int id, string newName, int? sortOrder);
        Task<bool> ArchiveLineAsync(int id);
    }
}
