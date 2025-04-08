using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.Extensions.Logging;
using System.Linq;
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

        public async Task<List<StoreNumber>> SearchStoreNumbersAsync(StoreNumberSearchDto searchDto)
        {
            _logger.LogInformation("Начало поиска торговых точек с заданными параметрами");

            var query = _context.StoreNumbers.AsQueryable();

            query = ApplyFilters(query, searchDto);

            var result = await query.ToListAsync();
            _logger.LogInformation("Поиск завершён. Найдено торговых точек: {count}", result.Count);

            return result;
        }

        private IQueryable<StoreNumber> ApplyFilters(IQueryable<StoreNumber> query, StoreNumberSearchDto searchDto)
        {
            if (searchDto.Id.HasValue)
            {
                query = query.Where(s => s.Id == searchDto.Id.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.Name))
            {
                query = query.Where(s => EF.Functions.ILike(s.Name.Trim(), $"%{searchDto.Name.Trim()}%"));
            }

            return query;
        }
    }
}
