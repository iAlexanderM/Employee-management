using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;
using System;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SearchLinesController : ControllerBase
    {
        private readonly ILineSearchService _searchService;

        public SearchLinesController(ILineSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchLines([FromQuery] LineSearchDto searchDto)
        {
            try
            {
                var lines = await _searchService.SearchLinesAsync(searchDto);
                return Ok(lines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }
    }
}
