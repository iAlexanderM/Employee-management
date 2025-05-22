using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;
using Microsoft.Extensions.Logging;
using EmployeeManagementServer.Models;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class StoreNumberController : ControllerBase
    {
        private readonly IStoreNumberService _storeNumberService;
        private readonly IMapper _mapper;
        private readonly ILogger<StoreNumberController> _logger;

        public StoreNumberController(IStoreNumberService storeNumberService, IMapper mapper, ILogger<StoreNumberController> logger)
        {
            _storeNumberService = storeNumberService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetStoreNumbers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] bool? isArchived = null)
        {
            try
            {
                if (page < 1 || pageSize < 1)
                {
                    return BadRequest("Page and pageSize must be greater than 0.");
                }

                int skip = (page - 1) * pageSize;
                int totalStoreNumbers = await _storeNumberService.GetTotalStoreNumbersCountAsync(isArchived);
                var storeNumbers = await _storeNumberService.GetStoreNumbersAsync(skip, pageSize, isArchived);

                var storeNumberDtos = _mapper.Map<List<StoreNumberDto>>(storeNumbers);

                return Ok(new
                {
                    total = totalStoreNumbers,
                    storeNumbers = storeNumberDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении зданий");
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStoreNumberById(int id)
        {
            try
            {
                var storeNumber = await _storeNumberService.GetStoreNumberByIdAsync(id);
                if (storeNumber == null)
                {
                    return NotFound("StoreNumber not found.");
                }

                var storeNumberDto = _mapper.Map<StoreNumberDto>(storeNumber);
                return Ok(storeNumberDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении точки с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateStoreNumber([FromBody] StoreNumberDto storeNumberDto)
        {
            try
            {
                if (storeNumberDto == null || string.IsNullOrWhiteSpace(storeNumberDto.Name))
                {
                    return BadRequest("Invalid data.");
                }

                var storeNumber = _mapper.Map<StoreNumber>(storeNumberDto);
                var createdStoreNumber = await _storeNumberService.AddStoreNumberAsync(storeNumber);

                if (createdStoreNumber == null)
                {
                    return Conflict("StoreNumber with the same name already exists.");
                }

                var createdStoreNumberDto = _mapper.Map<StoreNumberDto>(createdStoreNumber);
                return CreatedAtAction(nameof(GetStoreNumberById), new { id = createdStoreNumberDto.Id }, createdStoreNumberDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании точки");
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStoreNumber(int id, [FromBody] StoreNumberDto storeNumberDto)
        {
            try
            {
                if (storeNumberDto == null || string.IsNullOrWhiteSpace(storeNumberDto.Name))
                {
                    return BadRequest("Invalid data.");
                }

                var result = await _storeNumberService.UpdateStoreNumberAsync(id, storeNumberDto.Name, storeNumberDto.SortOrder);

                if (result == null)
                {
                    return NotFound("StoreNumber not found.");
                }

                if (result == false)
                {
                    return Conflict("StoreNumber with the same name already exists.");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении точки с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ArchiveStoreNumber(int id)
        {
            try
            {
                var success = await _storeNumberService.ArchiveStoreNumberAsync(id);
                if (!success)
                {
                    return NotFound("StoreNumber not found.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при архивировании точки с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }
    }
}