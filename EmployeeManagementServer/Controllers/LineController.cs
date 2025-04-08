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
    public class LineController : ControllerBase
    {
        private readonly ILineService _lineService;
        private readonly IMapper _mapper;
        private readonly ILogger<LineController> _logger;

        public LineController(ILineService lineService, IMapper mapper, ILogger<LineController> logger)
        {
            _lineService = lineService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetLines(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Page and pageSize must be greater than 0.");
            }

            int skip = (page - 1) * pageSize;
            int totalLines = await _lineService.GetTotalLinesCountAsync();
            var lines = await _lineService.GetLinesAsync(skip, pageSize);

            var lineDtos = _mapper.Map<List<LineDto>>(lines);

            return Ok(new
            {
                total = totalLines,
                lines = lineDtos
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetLineById(int id)
        {
            var line = await _lineService.GetLineByIdAsync(id);
            if (line == null)
            {
                return NotFound("Line not found.");
            }

            var lineDto = _mapper.Map<LineDto>(line);
            return Ok(lineDto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateLine([FromBody] LineDto lineDto)
        {
            if (lineDto == null || string.IsNullOrWhiteSpace(lineDto.Name))
            {
                return BadRequest("Invalid data.");
            }

            var line = _mapper.Map<Line>(lineDto);
            var createdLine = await _lineService.AddLineAsync(line);

            if (createdLine == null)
            {
                return Conflict("Line with the same name already exists.");
            }

            var createdLineDto = _mapper.Map<LineDto>(createdLine);
            return CreatedAtAction(nameof(GetLineById), new { id = createdLineDto.Id }, createdLineDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLine(int id, [FromBody] LineDto lineDto)
        {
            if (lineDto == null || string.IsNullOrWhiteSpace(lineDto.Name))
            {
                return BadRequest("Invalid data.");
            }

            var result = await _lineService.UpdateLineAsync(id, lineDto.Name, lineDto.SortOrder);

            if (result == null)
            {
                return NotFound("Line not found.");
            }

            if (result == false)
            {
                return Conflict("Line with the same name already exists.");
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ArchiveLine(int id)
        {
            var success = await _lineService.ArchiveLineAsync(id);
            if (!success)
            {
                return NotFound("Line not found.");
            }

            return NoContent();
        }
    }
}
