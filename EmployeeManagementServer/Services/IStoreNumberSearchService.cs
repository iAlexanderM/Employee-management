using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IStoreNumberSearchService
    {
        Task<(List<StoreNumber> storeNumbers, int total)> SearchStoreNumbersAsync(StoreNumberSearchDto searchDto, int skip, int pageSize);
    }
}
