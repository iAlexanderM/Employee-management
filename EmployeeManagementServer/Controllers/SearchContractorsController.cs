using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;
using System;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchContractorsController : ControllerBase
    {
        private readonly IContractorSearchService _searchService;

        public SearchContractorsController(IContractorSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchContractors([FromQuery] ContractorSearchDto searchDto)
        {
            try
            {
                var contractors = await _searchService.SearchContractorsAsync(searchDto);
                return Ok(contractors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }
    }
}
