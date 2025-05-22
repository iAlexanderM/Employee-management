using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchLinesController : ControllerBase
    {
        private readonly ILineSearchService _searchService;
        private readonly ILogger<SearchLinesController> _logger;

        public SearchLinesController(ILineSearchService searchService, ILogger<SearchLinesController> logger)
        {
            _searchService = searchService;
            _logger = logger;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchLines(
            [FromQuery] LineSearchDto searchDto,
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
                var (lines, total) = await _searchService.SearchLinesAsync(searchDto, skip, pageSize);
                return Ok(new
                {
                    total,
                    lines
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during line search.");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }
    }
}