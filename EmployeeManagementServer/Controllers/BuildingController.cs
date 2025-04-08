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
    public class BuildingController : ControllerBase
    {
        private readonly IBuildingService _buildingService;
        private readonly IMapper _mapper;
        private readonly ILogger<BuildingController> _logger;

        public BuildingController(IBuildingService buildingService, IMapper mapper, ILogger<BuildingController> logger)
        {
            _buildingService = buildingService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetBuildings(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Page and pageSize must be greater than 0.");
            }

            int skip = (page - 1) * pageSize;
            int totalBuildings = await _buildingService.GetTotalBuildingsCountAsync();
            var buildings = await _buildingService.GetBuildingsAsync(skip, pageSize);

            var buildingDtos = _mapper.Map<List<BuildingDto>>(buildings);

            return Ok(new
            {
                total = totalBuildings,
                buildings = buildingDtos
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetBuildingById(int id)
        {
            var building = await _buildingService.GetBuildingByIdAsync(id);
            if (building == null)
            {
                return NotFound("Building not found.");
            }

            var buildingDto = _mapper.Map<BuildingDto>(building);
            return Ok(buildingDto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateBuilding([FromBody] BuildingDto buildingDto)
        {
            if (buildingDto == null || string.IsNullOrWhiteSpace(buildingDto.Name))
            {
                return BadRequest("Invalid data.");
            }

            var building = _mapper.Map<Building>(buildingDto);
            var createdBuilding = await _buildingService.AddBuildingAsync(building);

            if (createdBuilding == null)
            {
                return Conflict("Building with the same name already exists.");
            }

            var createdBuildingDto = _mapper.Map<BuildingDto>(createdBuilding);
            return CreatedAtAction(nameof(GetBuildingById), new { id = createdBuildingDto.Id }, createdBuildingDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBuilding(int id, [FromBody] BuildingDto buildingDto)
        {
            if (buildingDto == null || string.IsNullOrWhiteSpace(buildingDto.Name))
            {
                return BadRequest("Invalid data.");
            }

            var result = await _buildingService.UpdateBuildingAsync(id, buildingDto.Name, buildingDto.SortOrder);

            if (result == null)
            {
                return NotFound("Building not found.");
            }

            if (result == false)
            {
                return Conflict("Building with the same name already exists.");
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ArchiveBuilding(int id)
        {
            var success = await _buildingService.ArchiveBuildingAsync(id);
            if (!success)
            {
                return NotFound("Building not found.");
            }

            return NoContent();
        }
    }
}
