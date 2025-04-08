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
    public class CitizenshipController : ControllerBase
    {
        private readonly ICitizenshipService _citizenshipService;
        private readonly IMapper _mapper;
        private readonly ILogger<CitizenshipController> _logger;

        public CitizenshipController(ICitizenshipService citizenshipService, IMapper mapper, ILogger<CitizenshipController> logger)
        {
            _citizenshipService = citizenshipService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetCitizenships(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Page and pageSize must be greater than 0.");
            }

            int skip = (page - 1) * pageSize;
            int totalCitizenships = await _citizenshipService.GetTotalCitizenshipsCountAsync();
            var citizenships = await _citizenshipService.GetCitizenshipsAsync(skip, pageSize);

            var citizenshipDtos = _mapper.Map<List<CitizenshipDto>>(citizenships);

            return Ok(new
            {
                total = totalCitizenships,
                citizenships = citizenshipDtos
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCitizenshipById(int id)
        {
            var citizenship = await _citizenshipService.GetCitizenshipByIdAsync(id);
            if (citizenship == null)
            {
                return NotFound("Citizenship not found.");
            }

            var citizenshipDto = _mapper.Map<CitizenshipDto>(citizenship);
            return Ok(citizenshipDto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCitizenship([FromBody] CitizenshipDto citizenshipDto)
        {
            if (citizenshipDto == null || string.IsNullOrWhiteSpace(citizenshipDto.Name))
            {
                return BadRequest("Invalid data.");
            }

            var citizenship = _mapper.Map<Citizenship>(citizenshipDto);
            var createdCitizenship = await _citizenshipService.AddCitizenshipAsync(citizenship);

            if (createdCitizenship == null)
            {
                return Conflict("Citizenship with the same name already exists.");
            }

            var createdCitizenshipDto = _mapper.Map<CitizenshipDto>(createdCitizenship);
            return CreatedAtAction(nameof(GetCitizenshipById), new { id = createdCitizenshipDto.Id }, createdCitizenshipDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCitizenship(int id, [FromBody] CitizenshipDto citizenshipDto)
        {
            if (citizenshipDto == null || string.IsNullOrWhiteSpace(citizenshipDto.Name))
            {
                return BadRequest("Invalid data.");
            }

            var result = await _citizenshipService.UpdateCitizenshipAsync(id, citizenshipDto.Name, citizenshipDto.SortOrder);

            if (result == null)
            {
                return NotFound("Citizenship not found.");
            }

            if (result == false)
            {
                return Conflict("Citizenship with the same name already exists.");
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ArchiveCitizenship(int id)
        {
            var success = await _citizenshipService.ArchiveCitizenshipAsync(id);
            if (!success)
            {
                return NotFound("Citizenship not found.");
            }

            return NoContent();
        }
    }
}
