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
    public class SearchCitizenshipsController : ControllerBase
    {
        private readonly ICitizenshipSearchService _searchService;

        public SearchCitizenshipsController(ICitizenshipSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchCitizenships([FromQuery] CitizenshipSearchDto searchDto)
        {
            try
            {
                var сitizenships = await _searchService.SearchCitizenshipsAsync(searchDto);
                return Ok(сitizenships);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }
    }
}
