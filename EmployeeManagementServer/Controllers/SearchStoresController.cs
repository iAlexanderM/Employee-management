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
    public class SearchStoresController : ControllerBase
    {
        private readonly IStoreSearchService _storeSearchService;
        private readonly IMapper _mapper;
        private readonly ILogger<SearchStoresController> _logger;

        public SearchStoresController(
            IStoreSearchService storeSearchService,
            IMapper mapper,
            ILogger<SearchStoresController> logger)
        {
            _storeSearchService = storeSearchService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> SearchStores(
            [FromQuery] StoreSearchDto searchDto,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Параметры страницы и размера должны быть больше нуля.");
            }

            var stores = await _storeSearchService.SearchStoresAsync(searchDto, page, pageSize);
            var total = await _storeSearchService.GetTotalStoresCountAsync(searchDto);
            var storeDtos = _mapper.Map<List<StoreDto>>(stores);

            return Ok(new
            {
                total,
                stores = storeDtos
            });
        }
    }
}