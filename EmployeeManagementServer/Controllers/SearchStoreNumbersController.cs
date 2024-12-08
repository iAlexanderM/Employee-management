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
    public class SearchStoreNumbersController : ControllerBase
    {
        private readonly IStoreNumberSearchService _searchService;

        public SearchStoreNumbersController(IStoreNumberSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchStoreNumbers([FromQuery] StoreNumberSearchDto searchDto)
        {
            try
            {
                var storeNumbers = await _searchService.SearchStoreNumbersAsync(searchDto);
                return Ok(storeNumbers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }
    }
}
