using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public interface IPassByStoreSearchService
    {
        Task<List<PassByStoreResponseDto>> SearchPassesByStoreAsync(PassByStoreSearchDto searchDto);
    }
}