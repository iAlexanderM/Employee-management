using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;
using EmployeeManagementServer.Models.DTOs;
using AutoMapper;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchContractorsController : ControllerBase
    {
        private readonly IContractorSearchService _contractorSearchService;
        private readonly IMapper _mapper;
        private readonly ILogger<SearchContractorsController> _logger;

        public SearchContractorsController(
            IContractorSearchService contractorSearchService,
            IMapper mapper,
            ILogger<SearchContractorsController> logger)
        {
            _contractorSearchService = contractorSearchService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> SearchContractors(
            [FromQuery] ContractorSearchDto searchDto,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Параметры страницы и размера должны быть больше нуля.");
            }

            _logger.LogInformation("Поиск контрагентов с параметрами: {@SearchDto}, page: {Page}, pageSize: {PageSize}", searchDto, page, pageSize);

            var contractors = await _contractorSearchService.SearchContractorsAsync(searchDto);
            var contractorDtos = _mapper.Map<List<ContractorDto>>(contractors);

            return Ok(new
            {
                total = contractors.Count,
                contractors = contractorDtos
            });
        }
    }
}