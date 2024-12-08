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
    public class StoreSearchService : IStoreSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StoreSearchService> _logger;

        public StoreSearchService(ApplicationDbContext context, ILogger<StoreSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Store>> SearchStoresAsync(StoreSearchDto searchDto)
        {
            _logger.LogInformation("Начало поиска магазинов с заданными параметрами");

            var query = _context.Stores.AsQueryable();

            query = ApplyFilters(query, searchDto);

            var result = await query.ToListAsync();
            _logger.LogInformation("Поиск завершён. Найдено магазинов: {count}", result.Count);

            return result;
        }

        private IQueryable<Store> ApplyFilters(IQueryable<Store> query, StoreSearchDto searchDto)
        {
            if (searchDto.Id.HasValue)
            {
                query = query.Where(s => s.Id == searchDto.Id.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.Building))
            {
                query = query.Where(s => s.Building.Trim() == searchDto.Building.Trim());
            }

            if (!string.IsNullOrEmpty(searchDto.Floor))
            {
                query = query.Where(s => s.Floor.Trim() == searchDto.Floor.Trim());
            }

            if (!string.IsNullOrEmpty(searchDto.Line))
            {
                query = query.Where(s => s.Line.Trim() == searchDto.Line.Trim());
            }

            if (!string.IsNullOrEmpty(searchDto.StoreNumber))
            {
                query = query.Where(s => s.StoreNumber.Trim() == searchDto.StoreNumber.Trim());
            }

            if (searchDto.IsArchived.HasValue)
            {
                query = query.Where(s => s.IsArchived == searchDto.IsArchived.Value);
            }

            return query;
        }
    }
}
