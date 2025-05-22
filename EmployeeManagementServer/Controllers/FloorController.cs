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
    public class FloorController : ControllerBase
    {
        private readonly IFloorService _floorService;
        private readonly IMapper _mapper;
        private readonly ILogger<FloorController> _logger;

        public FloorController(IFloorService floorService, IMapper mapper, ILogger<FloorController> logger)
        {
            _floorService = floorService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetFloors(
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
                int totalFloors = await _floorService.GetTotalFloorsCountAsync(isArchived);
                var floors = await _floorService.GetFloorsAsync(skip, pageSize, isArchived);

                var floorDtos = _mapper.Map<List<FloorDto>>(floors);

                return Ok(new
                {
                    total = totalFloors,
                    floors = floorDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении зданий");
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFloorById(int id)
        {
            try
            {
                var floor = await _floorService.GetFloorByIdAsync(id);
                if (floor == null)
                {
                    return NotFound("Floor not found.");
                }

                var floorDto = _mapper.Map<FloorDto>(floor);
                return Ok(floorDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении этажа с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateFloor([FromBody] FloorDto floorDto)
        {
            try
            {
                if (floorDto == null || string.IsNullOrWhiteSpace(floorDto.Name))
                {
                    return BadRequest("Invalid data.");
                }

                var floor = _mapper.Map<Floor>(floorDto);
                var createdFloor = await _floorService.AddFloorAsync(floor);

                if (createdFloor == null)
                {
                    return Conflict("Floor with the same name already exists.");
                }

                var createdFloorDto = _mapper.Map<FloorDto>(createdFloor);
                return CreatedAtAction(nameof(GetFloorById), new { id = createdFloorDto.Id }, createdFloorDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании здания");
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFloor(int id, [FromBody] FloorDto floorDto)
        {
            try
            {
                if (floorDto == null || string.IsNullOrWhiteSpace(floorDto.Name))
                {
                    return BadRequest("Invalid data.");
                }

                var result = await _floorService.UpdateFloorAsync(id, floorDto.Name, floorDto.SortOrder);

                if (result == null)
                {
                    return NotFound("Floor not found.");
                }

                if (result == false)
                {
                    return Conflict("Floor with the same name already exists.");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении этажа с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ArchiveFloor(int id)
        {
            try
            {
                var success = await _floorService.ArchiveFloorAsync(id);
                if (!success)
                {
                    return NotFound("Floor not found.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при архивировании этажа с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }
    }
}