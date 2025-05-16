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
    public class BuildingSearchService : IBuildingSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BuildingSearchService> _logger;

        public BuildingSearchService(ApplicationDbContext context, ILogger<BuildingSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(List<Building> buildings, int total)> SearchBuildingsAsync(BuildingSearchDto searchDto, int skip, int pageSize)
        {
            _logger.LogInformation("Начало поиска зданий с заданными параметрами");

            var query = _context.Buildings.AsQueryable();

            query = ApplyFilters(query, searchDto);

            int total = await query.CountAsync();

            var result = await query
                .OrderBy(b => b.SortOrder == null ? 1 : 0)
                .ThenBy(b => b.SortOrder ?? int.MaxValue)
                .ThenBy(b => b.Id)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            _logger.LogInformation("Поиск завершён. Найдено зданий: {count}", result.Count);

            return (result, total);
        }

        private IQueryable<Building> ApplyFilters(IQueryable<Building> query, BuildingSearchDto searchDto)
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