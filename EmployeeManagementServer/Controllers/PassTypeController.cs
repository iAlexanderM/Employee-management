using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Models.DTOs;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]

    public class PassTypeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PassTypeController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePassType([FromBody] PassTypeDto passTypeDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var passGroup = await _context.PassGroups.FindAsync(passTypeDto.PassGroupId);
            if (passGroup == null)
                return NotFound("Группа пропусков не найдена.");

            var passType = new PassType
            {
                Name = passTypeDto.Name,
                DurationInMonths = passTypeDto.DurationInMonths,
                Cost = passTypeDto.Cost,
                PrintTemplate = passTypeDto.PrintTemplate,
                SortOrder = passTypeDto.SortOrder,
                Color = passTypeDto.Color,
                PassGroupId = passTypeDto.PassGroupId,
                IsArchived = passTypeDto.IsArchived
            };

            await _context.PassTypes.AddAsync(passType);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPassTypeById), new { id = passType.Id }, passType);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPassTypeById(int id)
        {
            var passType = await _context.PassTypes.FindAsync(id);
            if (passType == null)
                return NotFound();

            return Ok(passType);
        }

        [HttpGet]
        public async Task<IActionResult> GetPassTypesByGroupId([FromQuery] int groupId)
        {
            var passTypes = await _context.PassTypes
                .Where(pt => pt.PassGroupId == groupId)
                .OrderBy(pt => pt.SortOrder)
                .ToListAsync();

            return Ok(passTypes);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePassType(int id, [FromBody] PassTypeDto passTypeDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var passType = await _context.PassTypes.FindAsync(id);
            if (passType == null)
                return NotFound();

            passType.Name = passTypeDto.Name;
            passType.DurationInMonths = passTypeDto.DurationInMonths;
            passType.Cost = passTypeDto.Cost;
            passType.PrintTemplate = passTypeDto.PrintTemplate;
            passType.SortOrder = passTypeDto.SortOrder;
            passType.Color = passTypeDto.Color;
            passType.IsArchived = passTypeDto.IsArchived;

            if (passType.PassGroupId != passTypeDto.PassGroupId)
            {
                var passGroup = await _context.PassGroups.FindAsync(passTypeDto.PassGroupId);
                if (passGroup == null)
                    return NotFound("Указанная группа пропусков не найдена.");

                passType.PassGroupId = passTypeDto.PassGroupId;
            }

            _context.PassTypes.Update(passType);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePassType(int id)
        {
            var passType = await _context.PassTypes.FindAsync(id);
            if (passType == null)
                return NotFound();

            _context.PassTypes.Remove(passType);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchPassTypes([FromQuery] int? id, [FromQuery] string? name)
        {
            var query = _context.PassTypes.AsQueryable();

            if (id.HasValue)
            {
                query = query.Where(pt => pt.Id == id.Value);
            }

            if (!string.IsNullOrWhiteSpace(name))
            {
                query = query.Where(pt => EF.Functions.ILike(pt.Name, $"%{name}%"));
            }

            var results = await query.ToListAsync();

            return Ok(results);
        }
    }
}
