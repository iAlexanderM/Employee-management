using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IStoreService
    {
        Task SaveChangesAsync();
        Task<int> GetTotalStoresCountAsync(string? building, string? floor, string? line, string? storeNumber, bool? isArchived = null);
        Task<List<Store>> GetAllStoresAsync(int skip, int pageSize, string? building, string? floor, string? line, string? storeNumber, bool? isArchived = null);
        Task<Store?> GetStoreByIdAsync(int id);
        Task<Store?> AddStoreAsync(Store store, string? createdBy = null);
        Task<bool?> UpdateStoreAsync(int id, string? newBuilding, string? newFloor, string? newLine, string? newStoreNumber, int? sortOrder, string? note, string? updatedBy = null);
        Task ArchiveStoreAsync(int id, string? archivedBy = null);
        Task UnarchiveStoreAsync(int id, string? unarchivedBy = null);
        Task UpdateStoreNoteAsync(int id, string? note, string? updatedBy = null);
    }
}