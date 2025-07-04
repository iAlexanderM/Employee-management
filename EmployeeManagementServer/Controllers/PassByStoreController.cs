using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PassByStoreController : ControllerBase
    {
        private readonly IPassByStoreSearchService _searchService;
        private readonly ILogger<PassByStoreController> _logger;

        public PassByStoreController(IPassByStoreSearchService searchService, ILogger<PassByStoreController> logger)
        {
            _searchService = searchService;
            _logger = logger;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchPassesByStore([FromQuery] PassByStoreSearchDto searchDto)
        {
            var requestId = Guid.NewGuid();
            _logger.LogInformation("Starting search request with criteria: {@SearchDto}, RequestId={RequestId}", searchDto, requestId);

            try
            {
                if (searchDto == null ||
                    string.IsNullOrEmpty(searchDto.Building) ||
                    string.IsNullOrEmpty(searchDto.Floor) ||
                    string.IsNullOrEmpty(searchDto.Line) ||
                    string.IsNullOrEmpty(searchDto.StoreNumber))
                {
                    _logger.LogWarning("Invalid search parameters: {@SearchDto}, RequestId={RequestId}", searchDto, requestId);
                    return BadRequest("All fields (Building, Floor, Line, StoreNumber) must be filled.");
                }

                searchDto.Normalize();
                var results = await _searchService.SearchPassesByStoreAsync(searchDto);

                if (!results.Any() || !results[0].Contractors.Any())
                {
                    _logger.LogInformation("No stores or contractors found for criteria: {@SearchDto}, RequestId={RequestId}", searchDto, requestId);
                    return Ok(results);
                }

                var contractorCount = results[0].Contractors.Count;
                var activePassCount = results[0].Contractors.Sum(c => c.ActivePasses?.Count ?? 0);
                var closedPassCount = results[0].Contractors.Sum(c => c.ClosedPasses?.Count ?? 0);

                _logger.LogInformation("Search completed: Found {ContractorCount} contractors, {ActivePassCount} active passes, {ClosedPassCount} closed passes, TotalCount={TotalCount}, Page={Page}, PageSize={PageSize}, RequestId={RequestId}",
                    contractorCount, activePassCount, closedPassCount, results[0].TotalCount, results[0].Page, results[0].PageSize, requestId);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing search request with criteria: {@SearchDto}, RequestId={RequestId}", searchDto, requestId);
                return StatusCode(500, $"Server error: {ex.Message}");
            }
        }
    }
}