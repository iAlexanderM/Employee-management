using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;
using Microsoft.EntityFrameworkCore;

public class PassTransactionSearchService : IPassTransactionSearchService
{
    private readonly ApplicationDbContext _context;

    public PassTransactionSearchService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(int TotalCount, List<PassTransactionResponseDto> Transactions)> SearchPassTransactionsAsync(
        PassTransactionSearchDto searchDto, int skip, int pageSize)
    {
        var query = _context.PassTransactions
            .Include(t => t.User)
            .Include(t => t.ContractorStorePasses)
                .ThenInclude(csp => csp.Contractor)
            .Include(t => t.ContractorStorePasses)
                .ThenInclude(csp => csp.Store)
            .Include(t => t.ContractorStorePasses)
                .ThenInclude(csp => csp.PassType)
            .AsQueryable();

        if (!string.IsNullOrEmpty(searchDto.Token))
            query = query.Where(t => t.Token.Contains(searchDto.Token));

        if (!string.IsNullOrEmpty(searchDto.ContractorName))
        {
            query = query.Where(t => t.ContractorStorePasses.Any(csp =>
                (csp.Contractor.LastName + " " + csp.Contractor.FirstName + " " + csp.Contractor.MiddleName).Trim() == searchDto.ContractorName));
        }

        if (!string.IsNullOrEmpty(searchDto.UserName))
        {
            query = query.Where(t => t.User.UserName == searchDto.UserName);
        }

        if (searchDto.ContractorId.HasValue)
        {
            query = query.Where(t => t.ContractorStorePasses.Any(csp => csp.ContractorId == searchDto.ContractorId.Value));
        }

        if (!string.IsNullOrEmpty(searchDto.StoreSearch))
        {
            if (int.TryParse(searchDto.StoreSearch, out int storeId))
            {
                query = query.Where(t => t.ContractorStorePasses.Any(csp => csp.StoreId == storeId));
            }
            else
            {
                var queryParts = searchDto.StoreSearch.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (queryParts.Length > 0)
                {
                    query = query.Where(t => t.ContractorStorePasses.Any(csp => csp.Store != null && (
                        (queryParts.Length > 0 && EF.Functions.Like(csp.Store.Building ?? "", $"%{queryParts[0]}%")) ||
                        (queryParts.Length > 1 && EF.Functions.Like(csp.Store.Floor ?? "", $"%{queryParts[1]}%")) ||
                        (queryParts.Length > 2 && EF.Functions.Like(csp.Store.Line ?? "", $"%{queryParts[2]}%")) ||
                        (queryParts.Length > 3 && EF.Functions.Like(csp.Store.StoreNumber ?? "", $"%{queryParts[3]}%"))
                    )));
                }
            }
        }

        if (searchDto.PassTypeId.HasValue)
            query = query.Where(t => t.ContractorStorePasses.Any(csp => csp.PassTypeId == searchDto.PassTypeId.Value));

        if (searchDto.CreatedAfter.HasValue)
            query = query.Where(t => t.CreatedAt >= searchDto.CreatedAfter.Value);

        if (searchDto.CreatedBefore.HasValue)
            query = query.Where(t => t.CreatedAt <= searchDto.CreatedBefore.Value);

        int totalCount = await query.CountAsync(); 

        var transactions = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip(skip)
            .Take(pageSize)
            .Select(t => new PassTransactionResponseDto
            {
                Id = t.Id,
                Token = t.Token,
                TokenType = t.TokenType,
                UserId = t.UserId,
                User = t.User,
                ContractorStorePasses = t.ContractorStorePasses.Select(csp => new ContractorStorePassDto
                {
                    ContractorId = csp.ContractorId,
                    Contractor = csp.Contractor,
                    StoreId = csp.StoreId,
                    Store = csp.Store,
                    PassTypeId = csp.PassTypeId,
                    PassType = csp.PassType,
                    Position = csp.Position
                }).ToList(),
                StartDate = t.StartDate,
                EndDate = t.EndDate,
                Amount = t.Amount,
                Status = t.Status,
                CreatedAt = t.CreatedAt,
                Position = t.Position,
                PassId = t.PassId
            })
            .ToListAsync();

        return (totalCount, transactions);
    }
}