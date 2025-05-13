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
        private readonly IHistoryService _historyService;
        private readonly IMapper _mapper;
        private readonly ILogger<StoreController> _logger;

        public StoreController(IStoreService storeService, IHistoryService historyService, IMapper mapper, ILogger<StoreController> logger)
        {
            _storeService = storeService;
            _historyService = historyService;
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
                int totalStores = await _storeService.GetTotalStoresCountAsync(building, floor, line, storeNumber);
                var stores = await _storeService.GetAllStoresAsync(skip, pageSize, building, floor, line, storeNumber);
                var storeDtos = _mapper.Map<List<StoreDto>>(stores);

                var response = new
                {
                    total = totalStores,
                    stores = storeDtos.Select(s => new
                    {
                        s.Id,
                        s.Building,
                        s.Floor,
                        s.Line,
                        s.StoreNumber,
                        s.Note,
                        s.CreatedAt,
                        s.UpdatedAt,
                        s.SortOrder,
                        s.IsArchived
                    }).ToList()
                };

                return Ok(response);
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
            try
            {
                var store = await _storeService.GetStoreByIdAsync(id);
                if (store == null)
                {
                    _logger.LogWarning("Магазин с ID {Id} не найден.", id);
                    return NotFound();
                }

                var storeDto = _mapper.Map<StoreDto>(store);
                return Ok(new
                {
                    storeDto.Id,
                    storeDto.Building,
                    storeDto.Floor,
                    storeDto.Line,
                    storeDto.StoreNumber,
                    storeDto.Note,
                    storeDto.CreatedAt,
                    storeDto.UpdatedAt,
                    storeDto.SortOrder,
                    storeDto.IsArchived
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении магазина с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateStore([FromBody] StoreDto storeDto)
        {
            try
            {
                if (storeDto == null || string.IsNullOrWhiteSpace(storeDto.Building) ||
                    string.IsNullOrWhiteSpace(storeDto.Line) || string.IsNullOrWhiteSpace(storeDto.StoreNumber) ||
                    string.IsNullOrWhiteSpace(storeDto.Floor))
                {
                    return BadRequest("Некорректные данные.");
                }

                var store = _mapper.Map<Store>(storeDto);
                var createdStore = await _storeService.AddStoreAsync(store, User.Identity?.Name ?? "Unknown");

                if (createdStore == null)
                {
                    return Conflict("Магазин с такими данными уже существует.");
                }

                var createdStoreDto = _mapper.Map<StoreDto>(createdStore);
                return CreatedAtAction(nameof(GetStore), new { id = createdStoreDto.Id }, createdStoreDto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании магазина");
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStore(int id, [FromBody] StoreDto storeDto)
        {
            try
            {
                if (storeDto == null || string.IsNullOrWhiteSpace(storeDto.Building) ||
                    string.IsNullOrWhiteSpace(storeDto.Line) || string.IsNullOrWhiteSpace(storeDto.StoreNumber) ||
                    string.IsNullOrWhiteSpace(storeDto.Floor))
                {
                    return BadRequest("Некорректные данные.");
                }

                var result = await _storeService.UpdateStoreAsync(
                    id,
                    storeDto.Building,
                    storeDto.Floor,
                    storeDto.Line,
                    storeDto.StoreNumber,
                    storeDto.SortOrder,
                    storeDto.Note,
                    User.Identity?.Name ?? "Unknown"
                );

                if (result == null)
                {
                    return NotFound("Магазин не найден или архивирован.");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении магазина с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPut("archive/{id}")]
        public async Task<IActionResult> ArchiveStore(int id)
        {
            try
            {
                await _storeService.ArchiveStoreAsync(id, User.Identity?.Name ?? "Unknown");
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Магазин с ID {Id} не найден для архивирования.", id);
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Ошибка при архивировании магазина с ID {Id}.", id);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при архивировании магазина с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPut("unarchive/{id}")]
        public async Task<IActionResult> UnarchiveStore(int id)
        {
            try
            {
                await _storeService.UnarchiveStoreAsync(id, User.Identity?.Name ?? "Unknown");
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Магазин с ID {Id} не найден для разархивации.", id);
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Ошибка при разархивировании магазина с ID {Id}.", id);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при разархивировании магазина с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPut("{id}/note")]
        public async Task<IActionResult> UpdateStoreNote(int id, [FromBody] UpdateNoteDto noteDto)
        {
            try
            {
                await _storeService.UpdateStoreNoteAsync(id, noteDto.Note, User.Identity?.Name ?? "Unknown");
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Магазин с ID {Id} не найден для обновления заметки.", id);
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Ошибка валидации заметки для магазина с ID {Id}.", id);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении заметки для магазина с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetStoreHistory(int id)
        {
            try
            {
                var history = await _historyService.GetHistoryAsync("store", id.ToString());
                if (!history.Any())
                {
                    _logger.LogWarning("История изменений для магазина с ID {Id} не найдена.", id);
                    return NotFound("История изменений для магазина не найдена.");
                }

                var historyDto = _mapper.Map<List<HistoryDto>>(history);
                return Ok(historyDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении истории изменений для магазина с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }
    }
}