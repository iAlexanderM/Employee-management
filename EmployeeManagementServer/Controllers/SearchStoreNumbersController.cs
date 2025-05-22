using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.Extensions.Logging;
using EmployeeManagementServer.Models;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchStoreNumbersController : ControllerBase
    {
        private readonly IStoreNumberSearchService _searchService;
        private readonly ILogger<SearchStoreNumbersController> _logger;

        public SearchStoreNumbersController(IStoreNumberSearchService searchService, ILogger<SearchStoreNumbersController> logger)
        {
            _searchService = searchService;
            _logger = logger;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchStoreNumbers(
            [FromQuery] StoreNumberSearchDto searchDto,
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
                var (storeNumbers, total) = await _searchService.SearchStoreNumbersAsync(searchDto, skip, pageSize);
                return Ok(new
                {
                    total,
                    storeNumbers
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during storeNumber search.");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }
    }
}