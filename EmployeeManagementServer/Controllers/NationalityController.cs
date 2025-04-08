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
    public class NationalityController : ControllerBase
    {
        private readonly INationalityService _nationalityService;
        private readonly IMapper _mapper;
        private readonly ILogger<NationalityController> _logger;

        public NationalityController(INationalityService nationalityService, IMapper mapper, ILogger<NationalityController> logger)
        {
            _nationalityService = nationalityService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetNationalities(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Page and pageSize must be greater than 0.");
            }

            int skip = (page - 1) * pageSize;
            int totalNationalities = await _nationalityService.GetTotalNationalitiesCountAsync();
            var nationalities = await _nationalityService.GetNationalitiesAsync(skip, pageSize);

            var nationalityDtos = _mapper.Map<List<NationalityDto>>(nationalities);

            return Ok(new
            {
                total = totalNationalities,
                nationalities = nationalityDtos
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetNationalityById(int id)
        {
            var nationality = await _nationalityService.GetNationalityByIdAsync(id);
            if (nationality == null)
            {
                return NotFound("Nationality not found.");
            }

            var nationalityDto = _mapper.Map<NationalityDto>(nationality);
            return Ok(nationalityDto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNationality([FromBody] NationalityDto nationalityDto)
        {
            if (nationalityDto == null || string.IsNullOrWhiteSpace(nationalityDto.Name))
            {
                return BadRequest("Invalid data.");
            }

            var nationality = _mapper.Map<Nationality>(nationalityDto);
            var createdNationality = await _nationalityService.AddNationalityAsync(nationality);

            if (createdNationality == null)
            {
                return Conflict("Nationality with the same name already exists.");
            }

            var createdNationalityDto = _mapper.Map<NationalityDto>(createdNationality);
            return CreatedAtAction(nameof(GetNationalityById), new { id = createdNationalityDto.Id }, createdNationalityDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNationality(int id, [FromBody] NationalityDto nationalityDto)
        {
            if (nationalityDto == null || string.IsNullOrWhiteSpace(nationalityDto.Name))
            {
                return BadRequest("Invalid data.");
            }

            var result = await _nationalityService.UpdateNationalityAsync(id, nationalityDto.Name, nationalityDto.SortOrder);

            if (result == null)
            {
                return NotFound("Nationality not found.");
            }

            if (result == false)
            {
                return Conflict("Nationality with the same name already exists.");
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ArchiveNationality(int id)
        {
            var success = await _nationalityService.ArchiveNationalityAsync(id);
            if (!success)
            {
                return NotFound("Nationality not found.");
            }

            return NoContent();
        }
    }
}
