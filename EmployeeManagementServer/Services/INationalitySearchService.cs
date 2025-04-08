using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Models;

namespace EmployeeManagementServer.Services
{
    public interface INationalitySearchService
    {
        Task<List<Nationality>> SearchNationalitiesAsync(NationalitySearchDto searchDto);
    }
}
