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
    public class FloorSearchService : IFloorSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FloorSearchService> _logger;

        public FloorSearchService(ApplicationDbContext context, ILogger<FloorSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Floor>> SearchFloorsAsync(FloorSearchDto searchDto)
        {
            _logger.LogInformation("Начало поиска этажей с заданными параметрами");

            var query = _context.Floors.AsQueryable();

            query = ApplyFilters(query, searchDto);

            var result = await query.OrderBy(f => f.SortOrder ?? f.Id).ToListAsync();
            _logger.LogInformation("Поиск завершён. Найдено этажей: {count}", result.Count);

            return result;
        }

        private IQueryable<Floor> ApplyFilters(IQueryable<Floor> query, FloorSearchDto searchDto)
        {
            if (searchDto.Id.HasValue)
            {
                query = query.Where(f => f.Id == searchDto.Id.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.Name))
            {
                query = query.Where(f => EF.Functions.ILike(f.Name.Trim(), $"%{searchDto.Name.Trim()}%"));
            }

            if (searchDto.IsArchived.HasValue)
            {
                query = query.Where(f => f.IsArchived == searchDto.IsArchived.Value);
            }

            return query;
        }
    }
}