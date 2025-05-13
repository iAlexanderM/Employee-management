using EmployeeManagementServer.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IHistoryService
    {
        Task LogHistoryAsync(History history);
        Task<IEnumerable<History>> GetHistoryAsync(string entityType, string entityId);
    }
}