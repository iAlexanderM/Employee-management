using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;
using System;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using EmployeeManagementServer.Models;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SearchPositionsController : ControllerBase
    {
        private readonly IPositionSearchService _searchService;

        public SearchPositionsController(IPositionSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchPositions([FromQuery] PositionSearchDto searchDto)
        {
            try
            {
                var positions = await _searchService.SearchPositionsAsync(searchDto);
                return Ok(positions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }
    }
}
