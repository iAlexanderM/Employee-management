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
    public class SearchFloorsController : ControllerBase
    {
        private readonly IFloorSearchService _searchService;

        public SearchFloorsController(IFloorSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchFloors([FromQuery] FloorSearchDto searchDto)
        {
            try
            {
                var floors = await _searchService.SearchFloorsAsync(searchDto);
                return Ok(floors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }
    }
}
