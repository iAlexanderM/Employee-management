using EmployeeManagementServer.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IStoreNumberService
    {
        Task<int> GetTotalStoreNumbersCountAsync(bool? isArchived = null);
        Task<List<StoreNumber>> GetStoreNumbersAsync(int skip, int pageSize, bool? isArchived = null);
        Task<StoreNumber> GetStoreNumberByIdAsync(int id);
        Task<StoreNumber> AddStoreNumberAsync(StoreNumber storeNumber);
        Task<bool?> UpdateStoreNumberAsync(int id, string newName, int? sortOrder);
        Task<bool> ArchiveStoreNumberAsync(int id);
    }
}
