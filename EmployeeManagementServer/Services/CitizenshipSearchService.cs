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
    public class CitizenshipSearchService : ICitizenshipSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CitizenshipSearchService> _logger;

        public CitizenshipSearchService(ApplicationDbContext context, ILogger<CitizenshipSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Citizenship>> SearchCitizenshipsAsync(CitizenshipSearchDto searchDto)
        {
            _logger.LogInformation("Начало поиска гражданств с заданными параметрами");

            var query = _context.Citizenships.AsQueryable();

            query = ApplyFilters(query, searchDto);

            var result = await query.ToListAsync();
            _logger.LogInformation("Поиск завершён. Найдено гражданств: {count}", result.Count);

            return result;
        }

        private IQueryable<Citizenship> ApplyFilters(IQueryable<Citizenship> query, CitizenshipSearchDto searchDto)
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
