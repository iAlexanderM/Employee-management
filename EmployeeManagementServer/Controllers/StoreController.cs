using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;
using EmployeeManagementServer.Models.DTOs;
using AutoMapper;
using EmployeeManagementServer.Models;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class StoreController : ControllerBase
    {
        private readonly IStoreService _storeService;
        private readonly IMapper _mapper;
        private readonly ILogger<StoreController> _logger;

        public StoreController(IStoreService storeService, IMapper mapper, ILogger<StoreController> logger)
        {
            _storeService = storeService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetStores(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? building = null, 
        [FromQuery] string? floor = null,    
        [FromQuery] string? line = null,      
        [FromQuery] string? storeNumber = null) 
        {
            try
            {
                if (page < 1 || pageSize < 1)
                {
                    return BadRequest("Параметры страницы и размера должны быть больше нуля.");
                }

                int skip = (page - 1) * pageSize;

                // Подсчитываем общее количество записей
                int totalStores = await _storeService.GetTotalStoresCountAsync(building, floor, line, storeNumber);

                // Получаем записи с учетом фильтров и пагинации
                var stores = await _storeService.GetAllStoresAsync(skip, pageSize, building, floor, line, storeNumber);

                // Маппим в DTO
                var storeDtos = _mapper.Map<List<StoreDto>>(stores);

                return Ok(new
                {
                    total = totalStores,
                    stores = storeDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении магазинов");
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStore(int id)
        {
            var store = await _storeService.GetStoreByIdAsync(id);
            if (store == null)
                return NotFound();

            var storeDto = _mapper.Map<StoreDto>(store);
            return Ok(storeDto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateStore([FromBody] StoreDto storeDto)
        {
            if (storeDto == null || string.IsNullOrWhiteSpace(storeDto.Building) ||
                string.IsNullOrWhiteSpace(storeDto.Line) || string.IsNullOrWhiteSpace(storeDto.StoreNumber) ||
                string.IsNullOrWhiteSpace(storeDto.Floor))
            {
                return BadRequest("Invalid data.");
            }

            var store = _mapper.Map<Store>(storeDto);
            var createdStore = await _storeService.AddStoreAsync(store);

            if (createdStore == null)
            {
                return Conflict("Store with the same details already exists.");
            }

            var createdStoreDto = _mapper.Map<StoreDto>(createdStore);
            return CreatedAtAction(nameof(GetStore), new { id = createdStoreDto.Id }, createdStoreDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStore(int id, [FromBody] StoreDto storeDto)
        {
            if (storeDto == null || string.IsNullOrWhiteSpace(storeDto.Building) ||
                string.IsNullOrWhiteSpace(storeDto.Line) || string.IsNullOrWhiteSpace(storeDto.StoreNumber) ||
                string.IsNullOrWhiteSpace(storeDto.Floor))
            {
                return BadRequest("Invalid data.");
            }

            try
            {
                var result = await _storeService.UpdateStoreAsync(
                    id, storeDto.Building, storeDto.Floor, storeDto.Line, storeDto.StoreNumber, storeDto.SortOrder);

                if (result == null)
                {
                    return NotFound("Store not found or archived.");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An unexpected error occurred: " + ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ArchiveStore(int id)
        {
            var result = await _storeService.ArchiveStoreAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPut("Unarchive/{id}")]
        public async Task<IActionResult> UnarchiveStore(int id)
        {
            var result = await _storeService.UnarchiveStoreAsync(id);
            if (!result)
                return NotFound("Store not found or not archived.");

            return NoContent();
        }
    }
}
