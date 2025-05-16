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
    public class LineSearchService : ILineSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LineSearchService> _logger;

        public LineSearchService(ApplicationDbContext context, ILogger<LineSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Line>> SearchLinesAsync(LineSearchDto searchDto)
        {
            _logger.LogInformation("Начало поиска линий с заданными параметрами");

            var query = _context.Lines.AsQueryable();

            query = ApplyFilters(query, searchDto);

            var result = await query.OrderBy(l => l.SortOrder ?? l.Id).ToListAsync();
            _logger.LogInformation("Поиск завершён. Найдено линий: {count}", result.Count);

            return result;
        }

        private IQueryable<Line> ApplyFilters(IQueryable<Line> query, LineSearchDto searchDto)
        {
            if (searchDto.Id.HasValue)
            {
                query = query.Where(l => l.Id == searchDto.Id.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.Name))
            {
                query = query.Where(l => EF.Functions.ILike(l.Name.Trim(), $"%{searchDto.Name.Trim()}%"));
            }

            if (searchDto.IsArchived.HasValue)
            {
                query = query.Where(l => l.IsArchived == searchDto.IsArchived.Value);
            }

            return query;
        }
    }
}