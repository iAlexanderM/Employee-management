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
    public class NationalitySearchService : INationalitySearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NationalitySearchService> _logger;

        public NationalitySearchService(ApplicationDbContext context, ILogger<NationalitySearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Nationality>> SearchNationalitiesAsync(NationalitySearchDto searchDto)
        {
            _logger.LogInformation("Начало поиска национальностей с заданными параметрами");

            var query = _context.Nationalities.AsQueryable();

            query = ApplyFilters(query, searchDto);

            var result = await query.ToListAsync();
            _logger.LogInformation("Поиск завершён. Найдено национальностей: {count}", result.Count);

            return result;
        }

        private IQueryable<Nationality> ApplyFilters(IQueryable<Nationality> query, NationalitySearchDto searchDto)
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
