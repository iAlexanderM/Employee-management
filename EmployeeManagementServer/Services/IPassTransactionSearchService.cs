using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public interface IPassTransactionSearchService
    {
        Task<(List<PassTransaction> Transactions, int TotalCount)> SearchPassTransactionsAsync(PassTransactionSearchDto searchDto, int skip, int take);
    }
}
