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
                string buildingFilter = $"{searchDto.Building.Trim()}%";
                query = query.Where(s => EF.Functions.ILike(s.Building, buildingFilter));
            }

            if (!string.IsNullOrEmpty(searchDto.Floor))
            {
                string floorFilter = $"{searchDto.Floor.Trim()}%";
                query = query.Where(s => EF.Functions.ILike(s.Floor, floorFilter));
            }

            if (!string.IsNullOrEmpty(searchDto.Line))
            {
                string lineFilter = $"{searchDto.Line.Trim()}%";
                query = query.Where(s => EF.Functions.ILike(s.Line, lineFilter));
            }

            if (!string.IsNullOrEmpty(searchDto.StoreNumber))
            {
                string storeNumberFilter = $"{searchDto.StoreNumber.Trim()}%";
                query = query.Where(s => EF.Functions.ILike(s.StoreNumber, storeNumberFilter));
            }

            if (searchDto.IsArchived.HasValue)
            {
                query = query.Where(s => s.IsArchived == searchDto.IsArchived.Value);
            }

            return query;
        }
    }
}
