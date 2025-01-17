using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;

namespace EmployeeManagementServer.Services
{
    public class PassTransactionSearchService : IPassTransactionSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PassTransactionSearchService> _logger;

        public PassTransactionSearchService(ApplicationDbContext context, ILogger<PassTransactionSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(List<PassTransaction> Transactions, int TotalCount)> SearchPassTransactionsAsync(PassTransactionSearchDto searchDto, int skip, int take)
        {
            var query = _context.PassTransactions
                .Include(t => t.Contractor)
                .Include(t => t.Store)
                .Include(t => t.PassType)
                .Include(t => t.User)
                .Include(t => t.Pass)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchDto.Token))
                query = query.Where(t => t.Token.Contains(searchDto.Token));

            if (searchDto.ContractorId.HasValue)
                query = query.Where(t => t.ContractorId == searchDto.ContractorId.Value);

            if (searchDto.StoreId.HasValue)
                query = query.Where(t => t.StoreId == searchDto.StoreId.Value);

            if (searchDto.PassTypeId.HasValue)
                query = query.Where(t => t.PassTypeId == searchDto.PassTypeId.Value);

            if (searchDto.CreatedAfter.HasValue)
                query = query.Where(t => t.CreatedAt >= searchDto.CreatedAfter.Value);

            if (searchDto.CreatedBefore.HasValue)
                query = query.Where(t => t.CreatedAt <= searchDto.CreatedBefore.Value);

            int totalCount = await query.CountAsync();
            var transactions = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            return (transactions, totalCount);
        }
    }
}
