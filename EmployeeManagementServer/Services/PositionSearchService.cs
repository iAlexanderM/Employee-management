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
    public class PositionSearchService : IPositionSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PositionSearchService> _logger;

        public PositionSearchService(ApplicationDbContext context, ILogger<PositionSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Position>> SearchPositionsAsync(PositionSearchDto searchDto)
        {
            _logger.LogInformation("Начало поиска должностей с заданными параметрами");

            var query = _context.Positions.AsQueryable();

            query = ApplyFilters(query, searchDto);

            var result = await query.ToListAsync();
            _logger.LogInformation("Поиск завершён. Найдено должностей: {count}", result.Count);

            return result;
        }

        private IQueryable<Position> ApplyFilters(IQueryable<Position> query, PositionSearchDto searchDto)
        {
            if (searchDto.Id.HasValue)
            {
                query = query.Where(b => b.Id == searchDto.Id.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.Name))
            {
                query = query.Where(b => EF.Functions.ILike(b.Name.Trim(), $"%{searchDto.Name.Trim()}%"));
            }

            return query;
        }
    }
}
