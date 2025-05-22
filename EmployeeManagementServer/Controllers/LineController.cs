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
                int totalLines = await _lineService.GetTotalLinesCountAsync(isArchived);
                var lines = await _lineService.GetLinesAsync(skip, pageSize, isArchived);

                var lineDtos = _mapper.Map<List<LineDto>>(lines);

                return Ok(new
                {
                    total = totalLines,
                    lines = lineDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении зданий");
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetLineById(int id)
        {
            try
            {
                var line = await _lineService.GetLineByIdAsync(id);
                if (line == null)
                {
                    return NotFound("Line not found.");
                }

                var lineDto = _mapper.Map<LineDto>(line);
                return Ok(lineDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении линии с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateLine([FromBody] LineDto lineDto)
        {
            try
            {
                if (lineDto == null || string.IsNullOrWhiteSpace(lineDto.Name))
                {
                    return BadRequest("Invalid data.");
                }

                var line = _mapper.Map<Line>(lineDto);
                var createdLine = await _lineService.AddLineAsync(line);

                if (createdLine == null)
                {
                    return Conflict("Lime with the same name already exists.");
                }

                var createdLineDto = _mapper.Map<LineDto>(createdLine);
                return CreatedAtAction(nameof(GetLineById), new { id = createdLineDto.Id }, createdLineDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании линии");
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLine(int id, [FromBody] LineDto lineDto)
        {
            try
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
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении здания с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ArchiveLine(int id)
        {
            try
            {
                var success = await _lineService.ArchiveLineAsync(id);
                if (!success)
                {
                    return NotFound("Line not found.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при архивировании линии с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }
    }
}