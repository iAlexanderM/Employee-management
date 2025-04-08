using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public interface IFloorSearchService
    {
        Task<List<Floor>> SearchFloorsAsync(FloorSearchDto searchDto);
    }
}
