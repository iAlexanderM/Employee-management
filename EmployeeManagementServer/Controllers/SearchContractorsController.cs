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
    public class SearchContractorsController : ControllerBase
    {
        private readonly IContractorSearchService _searchService;
        private readonly ILogger<SearchContractorsController> _logger;

        public SearchContractorsController(
            IContractorSearchService searchService,
            ILogger<SearchContractorsController> logger)
        {
            _searchService = searchService;
            _logger = logger;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchContractors([FromQuery] ContractorSearchDto searchDto)
        {
            try
            {
                var contractors = await _searchService.SearchContractorsAsync(searchDto);
                return Ok(contractors); // Возвращаем найденные записи
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при выполнении поиска");
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }
    }
}
