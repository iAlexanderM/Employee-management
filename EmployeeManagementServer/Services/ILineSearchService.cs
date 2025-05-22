using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface ILineSearchService
    {
        Task<(List<Line> lines, int total)> SearchLinesAsync(LineSearchDto searchDto, int skip, int pageSize);
    }
}
