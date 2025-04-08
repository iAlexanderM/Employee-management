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
        public async Task<IActionResult> SearchBuildings([FromQuery] BuildingSearchDto searchDto)
        {
            try
            {
                var buildings = await _searchService.SearchBuildingsAsync(searchDto);
                return Ok(buildings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during building search.");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }
    }
}
