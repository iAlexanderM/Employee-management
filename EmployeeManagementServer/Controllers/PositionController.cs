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
    public class PositionController : ControllerBase
    {
        private readonly IPositionService _positionService;
        private readonly IMapper _mapper;
        private readonly ILogger<PositionController> _logger;

        public PositionController(IPositionService positionService, IMapper mapper, ILogger<PositionController> logger)
        {
            _positionService = positionService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetPositions(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Page and pageSize must be greater than 0.");
            }

            int skip = (page - 1) * pageSize;
            int totalPositions = await _positionService.GetTotalPositionsCountAsync();
            var positions = await _positionService.GetPositionsAsync(skip, pageSize);

            var positionDtos = _mapper.Map<List<PositionDto>>(positions);

            return Ok(new
            {
                total = totalPositions,
                positions = positionDtos
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPositionById(int id)
        {
            var position = await _positionService.GetPositionByIdAsync(id);
            if (position == null)
            {
                return NotFound("Position not found.");
            }

            var positionDto = _mapper.Map<PositionDto>(position);
            return Ok(positionDto);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePosition([FromBody] PositionDto positionDto)
        {
            if (positionDto == null || string.IsNullOrWhiteSpace(positionDto.Name))
            {
                return BadRequest("Invalid data.");
            }

            var position = _mapper.Map<Position>(positionDto);
            var createdPosition = await _positionService.AddPositionAsync(position);

            if (createdPosition == null)
            {
                return Conflict("Position with the same name already exists.");
            }

            var createdPositionDto = _mapper.Map<PositionDto>(createdPosition);
            return CreatedAtAction(nameof(GetPositionById), new { id = createdPositionDto.Id }, createdPositionDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePosition(int id, [FromBody] PositionDto positionDto)
        {
            if (positionDto == null || string.IsNullOrWhiteSpace(positionDto.Name))
            {
                return BadRequest("Invalid data.");
            }

            var result = await _positionService.UpdatePositionAsync(id, positionDto.Name, positionDto.SortOrder);

            if (result == null)
            {
                return NotFound("Position not found.");
            }

            if (result == false)
            {
                return Conflict("Position with the same name already exists.");
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ArchivePosition(int id)
        {
            var success = await _positionService.ArchivePositionAsync(id);
            if (!success)
            {
                return NotFound("Position not found.");
            }

            return NoContent();
        }
    }
}
