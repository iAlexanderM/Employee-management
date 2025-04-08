using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Models;

namespace EmployeeManagementServer.Services
{
    public interface IPositionSearchService
    {
        Task<List<Position>> SearchPositionsAsync(PositionSearchDto searchDto);
    }
}
