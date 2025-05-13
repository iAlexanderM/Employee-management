using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public interface IStoreSearchService
    {
        Task<List<Store>> SearchStoresAsync(StoreSearchDto searchDto, int page, int pageSize);
        Task<int> GetTotalStoresCountAsync(StoreSearchDto searchDto);
    }
}
