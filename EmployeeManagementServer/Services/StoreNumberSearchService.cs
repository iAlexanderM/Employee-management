using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.Extensions.Logging;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public class StoreNumberSearchService : IStoreNumberSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StoreNumberSearchService> _logger;

        public StoreNumberSearchService(ApplicationDbContext context, ILogger<StoreNumberSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(List<StoreNumber> storeNumbers, int total)> SearchStoreNumbersAsync(StoreNumberSearchDto searchDto, int skip, int pageSize)
        {
            _logger.LogInformation("Начало поиска точки с заданными параметрами");

            var query = _context.StoreNumbers.AsQueryable();

            query = ApplyFilters(query, searchDto);

            int total = await query.CountAsync();

            var result = await query
                .OrderBy(b => b.SortOrder == null ? 1 : 0)
                .ThenBy(b => b.SortOrder ?? int.MaxValue)
                .ThenBy(b => b.Id)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            _logger.LogInformation("Поиск завершён. Найдено точек: {count}", result.Count);

            return (result, total);
        }

        private IQueryable<StoreNumber> ApplyFilters(IQueryable<StoreNumber> query, StoreNumberSearchDto searchDto)
        {
            if (searchDto.Id.HasValue)
            {
                query = query.Where(b => b.Id == searchDto.Id.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.Name))
            {
                query = query.Where(b => EF.Functions.ILike(b.Name.Trim(), $"%{searchDto.Name.Trim()}%"));
            }

            if (searchDto.IsArchived.HasValue)
            {
                query = query.Where(b => b.IsArchived == searchDto.IsArchived.Value);
            }

            return query;
        }
    }
}