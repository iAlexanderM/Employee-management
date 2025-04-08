using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public interface IPassTransactionSearchService
    {
        Task<(int TotalCount, List<PassTransactionResponseDto> Transactions)> SearchPassTransactionsAsync(
            PassTransactionSearchDto searchDto, int skip, int pageSize);
    }
}