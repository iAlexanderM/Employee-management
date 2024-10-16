using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;
using System;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchContractorsController : ControllerBase
    {
        private readonly ContractorSearchService _searchService;

        public SearchContractorsController(ContractorSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchContractors(
            [FromQuery] int? id,
            [FromQuery] string? firstName,
            [FromQuery] string? lastName,
            [FromQuery] string? middleName,
            [FromQuery] DateTime? birthDate,
            [FromQuery] string? documentType,
            [FromQuery] string? passportSerialNumber,
            [FromQuery] string? passportIssuedBy,
            [FromQuery] DateTime? passportIssueDate,
            [FromQuery] string? productType,
            [FromQuery] string? phoneNumber,
            [FromQuery] string? citizenship,
            [FromQuery] string? nationality)
        {
            try
            {
                var contractors = await _searchService.SearchContractorsAsync(
                    id, firstName, lastName, middleName, birthDate, documentType,
                    passportSerialNumber, passportIssuedBy, passportIssueDate,
                    productType, citizenship, nationality, phoneNumber);

                return Ok(contractors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }
    }
}
