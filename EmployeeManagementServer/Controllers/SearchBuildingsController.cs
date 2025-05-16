using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchBuildingsController : ControllerBase
    {
        private readonly IBuildingSearchService _searchService;
        private readonly ILogger<SearchBuildingsController> _logger;

        public SearchBuildingsController(IBuildingSearchService searchService, ILogger<SearchBuildingsController> logger)
        {
            _searchService = searchService;
            _logger = logger;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchBuildings(
            [FromQuery] BuildingSearchDto searchDto,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            try
            {
                if (page < 1 || pageSize < 1)
                {
                    return BadRequest("Page and pageSize must be greater than 0.");
                }

                int skip = (page - 1) * pageSize;
                var (buildings, total) = await _searchService.SearchBuildingsAsync(searchDto, skip, pageSize);
                return Ok(new
                {
                    total,
                    buildings
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during building search.");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }
    }
}