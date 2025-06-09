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

        public async Task<List<Store>> SearchStoresAsync(StoreSearchDto searchDto, int page, int pageSize)
        {
            _logger.LogInformation("Начало поиска магазинов с параметрами: {@SearchDto}, page: {Page}, pageSize: {PageSize}", searchDto, page, pageSize);

            var query = _context.Stores.AsQueryable();
            query = ApplyFilters(query, searchDto);

            var result = await query
                .OrderBy(s => s.SortOrder ?? s.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            _logger.LogInformation("Поиск завершен. Найдено магазинов: {Count}", result.Count);
            return result;
        }

        public async Task<int> GetTotalStoresCountAsync(StoreSearchDto searchDto)
        {
            var query = _context.Stores.AsQueryable();
            query = ApplyFilters(query, searchDto);
            return await query.CountAsync();
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
            else
            {
                query = query.Where(s => !s.IsArchived);
            }

            return query;
        }
    }
}