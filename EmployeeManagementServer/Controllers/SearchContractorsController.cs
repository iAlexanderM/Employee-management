using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;
using System;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SearchContractorsController : ControllerBase
    {
        private readonly IContractorSearchService _searchService;
        private readonly ILogger<SearchContractorsController> _logger;
        private readonly IMapper _mapper;

        public SearchContractorsController(
            IMapper mapper,
            IContractorSearchService searchService,
            ILogger<SearchContractorsController> logger)
        {
            _searchService = searchService;
            _logger = logger;
            _mapper = mapper;
        }

        [HttpPost("search")]
        public async Task<IActionResult> SearchContractors([FromBody] ContractorSearchDto searchDto)
        {
            try
            {
                var contractors = await _searchService.SearchContractorsAsync(searchDto);
                var contractorDtos = _mapper.Map<List<ContractorDto>>(contractors);
                return Ok(contractorDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при выполнении поиска");
                return StatusCode(500, $"Ошибка при выполнении поиска: {ex.Message}");
            }
        }

        [HttpPost("search/archived")]
        public async Task<IActionResult> SearchArchivedContractors([FromBody] ContractorSearchDto searchDto)
        {
            try
            {
                // Принудительно включаем только архивных контрагентов
                searchDto.IncludeArchived = true;
                var contractors = await _searchService.SearchContractorsAsync(searchDto);
                contractors = contractors.Where(c => c.IsArchived).ToList();
                var contractorDtos = _mapper.Map<List<ContractorDto>>(contractors);
                return Ok(contractorDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при выполнении поиска архивных контрагентов");
                return StatusCode(500, $"Ошибка при выполнении поиска архивных контрагентов: {ex.Message}");
            }
        }
    }
}