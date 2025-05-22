using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IFloorSearchService
    {
        Task<(List<Floor> floors, int total)> SearchFloorsAsync(FloorSearchDto searchDto, int skip, int pageSize);
    }
}
