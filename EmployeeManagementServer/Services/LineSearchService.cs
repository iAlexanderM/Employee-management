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
    public class LineSearchService : ILineSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LineSearchService> _logger;

        public LineSearchService(ApplicationDbContext context, ILogger<LineSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(List<Line> lines, int total)> SearchLinesAsync(LineSearchDto searchDto, int skip, int pageSize)
        {
            _logger.LogInformation("Начало поиска линий с заданными параметрами");

            var query = _context.Lines.AsQueryable();

            query = ApplyFilters(query, searchDto);

            int total = await query.CountAsync();

            var result = await query
                .OrderBy(b => b.SortOrder == null ? 1 : 0)
                .ThenBy(b => b.SortOrder ?? int.MaxValue)
                .ThenBy(b => b.Id)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            _logger.LogInformation("Поиск завершён. Найдено линий: {count}", result.Count);

            return (result, total);
        }

        private IQueryable<Line> ApplyFilters(IQueryable<Line> query, LineSearchDto searchDto)
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