using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PassByStoreController : ControllerBase
    {
        private readonly IPassByStoreSearchService _searchService;
        private readonly ApplicationDbContext _context;

        public PassByStoreController(IPassByStoreSearchService searchService, ApplicationDbContext context)
        {
            _searchService = searchService;
            _context = context;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchPassesByStore([FromQuery] PassByStoreSearchDto searchDto, [FromQuery] bool? isArchived = null)
        {
            try
            {
                if (searchDto == null ||
                    string.IsNullOrEmpty(searchDto.Building) ||
                    string.IsNullOrEmpty(searchDto.Floor) ||
                    string.IsNullOrEmpty(searchDto.Line) ||
                    string.IsNullOrEmpty(searchDto.StoreNumber))
                {
                    return BadRequest("Все поля (Building, Floor, Line, StoreNumber) должны быть заполнены.");
                }

                searchDto.IsArchived = isArchived;
                var results = await _searchService.SearchPassesByStoreAsync(searchDto);
                return Ok(results);
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}