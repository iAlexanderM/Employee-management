using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Models.DTOs;
using System.ComponentModel.DataAnnotations;
using EmployeeManagementServer.Models.EmployeeManagementServer.Models;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PassGroupController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PassGroupController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePassGroup([FromBody] PassGroupDto passGroupDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var passGroup = new PassGroup
            {
                Name = passGroupDto.Name,
                Description = passGroupDto.Description,
                Color = passGroupDto.Color
            };

            await _context.PassGroups.AddAsync(passGroup);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPassGroupById), new { id = passGroup.Id }, passGroup);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPassGroupById(int id)
        {
            var passGroup = await _context.PassGroups
                .Include(pg => pg.PassTypes)
                .FirstOrDefaultAsync(pg => pg.Id == id);
            if (passGroup == null)
                return NotFound();

            return Ok(passGroup);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPassGroups()
        {
            var passGroups = await _context.PassGroups
                .Include(pg => pg.PassTypes)
                .ToListAsync();
            return Ok(passGroups);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePassGroup(int id, [FromBody] PassGroupDto passGroupDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var passGroup = await _context.PassGroups.FindAsync(id);
            if (passGroup == null)
                return NotFound();

            passGroup.Name = passGroupDto.Name;
            passGroup.Description = passGroupDto.Description;
            passGroup.Color = passGroupDto.Color;

            _context.PassGroups.Update(passGroup);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePassGroup(int id)
        {
            var passGroup = await _context.PassGroups.FindAsync(id);
            if (passGroup == null)
                return NotFound();

            _context.PassGroups.Remove(passGroup);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
