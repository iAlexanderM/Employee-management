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
    public class SearchNationalitiesController : ControllerBase
    {
        private readonly INationalitySearchService _searchService;

        public SearchNationalitiesController(INationalitySearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchNationalities([FromQuery] NationalitySearchDto searchDto)
        {
            try
            {
                var nationalities = await _searchService.SearchNationalitiesAsync(searchDto);
                return Ok(nationalities);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }
    }
}
