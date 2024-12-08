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
    public class SearchStoresController : ControllerBase
    {
        private readonly IStoreSearchService _searchService;

        public SearchStoresController(IStoreSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchStores([FromQuery] StoreSearchDto searchDto)
        {
            try
            {
                searchDto.Normalize();

                var stores = await _searchService.SearchStoresAsync(searchDto);
                return Ok(stores);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }
    }
}
