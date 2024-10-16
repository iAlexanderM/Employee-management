using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public interface IContractorSearchService
    {
        Task<List<Contractor>> SearchContractorsAsync(ContractorSearchDto searchDto);
    }
}
