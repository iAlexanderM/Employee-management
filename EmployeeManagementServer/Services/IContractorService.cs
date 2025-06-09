using EmployeeManagementServer.Models;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Services
{
    public interface IContractorService
    {
        Task SaveChangesAsync();
        Task UpdateContractorAsync(Contractor contractor, List<IFormFile> newPhotos, List<IFormFile> newDocumentPhotos, List<int> deletedPhotoIds, string updatedBy = "Unknown");
        Task<List<Contractor>> GetAllContractorsAsync();
        Task<Contractor> GetContractorByIdAsync(int id);
        Task CreateContractorAsync(Contractor contractor, string? createdBy = null);
        Task<Contractor?> FindContractorByPassportSerialNumberAsync(string passportSerialNumber);
        Task<int> GetTotalContractorsCountAsync(bool? isArchived = false);
        Task<List<Contractor>> GetContractorsAsync(int skip, int take, bool? isArchived = false);
        Task<string?> GetLastNonDocumentPhotoAsync(int contractorId);
        Task ArchiveContractorAsync(int id, string archivedBy = "Unknown");
        Task UnarchiveContractorAsync(int id, string unarchivedBy = "Unknown");
        Task UpdateNoteAsync(int id, string note, string updatedBy = "Unknown");
    }
}