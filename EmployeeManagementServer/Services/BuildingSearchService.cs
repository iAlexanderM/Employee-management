using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public class BuildingSearchService : IBuildingSearchService
    {
        private readonly ApplicationDbContext _context;

        public BuildingSearchService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Building>> SearchBuildingsAsync(BuildingSearchDto searchDto)
        {
            var query = _context.Buildings.AsQueryable();

            // Фильтрация по ID
            if (searchDto.Id.HasValue)
            {
                query = query.Where(b => b.Id == searchDto.Id.Value);
            }

            // Фильтрация по имени
            if (!string.IsNullOrEmpty(searchDto.Name))
            {
                query = query.Where(b => EF.Functions.ILike(b.Name, $"%{searchDto.Name.Trim()}%"));
            }

            // Фильтрация по статусу архивности
            if (searchDto.IsArchived.HasValue)
            {
                query = query.Where(b => b.IsArchived == searchDto.IsArchived.Value);
            }

            return await query.OrderBy(b => b.SortOrder ?? b.Id).ToListAsync(); // Упорядочивание результата
        }
    }
}
