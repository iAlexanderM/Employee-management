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
            [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Page and pageSize must be greater than 0.");
            }

            int skip = (page - 1) * pageSize;
            int totalFloors = await _floorService.GetTotalFloorsCountAsync();
            var floors = await _floorService.GetFloorsAsync(skip, pageSize);

            var floorDtos = _mapper.Map<List<FloorDto>>(floors);

            return Ok(new
            {
                total = totalFloors,
                floors = floorDtos
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFloorById(int id)
        {
            var floor = await _floorService.GetFloorByIdAsync(id);
            if (floor == null)
            {
                return NotFound("Floor not found.");
            }

            var floorDto = _mapper.Map<FloorDto>(floor);
            return Ok(floorDto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateFloor([FromBody] FloorDto floorDto)
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

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFloor(int id, [FromBody] FloorDto floorDto)
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> ArchiveFloor(int id)
        {
            var success = await _floorService.ArchiveFloorAsync(id);
            if (!success)
            {
                return NotFound("Floor not found.");
            }

            return NoContent();
        }
    }
}
