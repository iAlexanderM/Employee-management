using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;

namespace EmployeeManagementServer.Services
{
    public interface IStoreService
    {
        Task<int> GetTotalStoresCountAsync(string building, string floor, string line, string storeNumber);
        Task<List<Store>> GetAllStoresAsync(int skip, int pageSize, string building, string floor, string line, string storeNumber);
        Task<Store> GetStoreByIdAsync(int id);
        Task<Store> AddStoreAsync(Store store);
        Task<bool?> UpdateStoreAsync(int id, string newBuilding, string newFloor, string newLine, string newStoreNumber, int? sortOrder);
        Task<bool> ArchiveStoreAsync(int id);
        Task<bool> UnarchiveStoreAsync(int id);
    }
}
