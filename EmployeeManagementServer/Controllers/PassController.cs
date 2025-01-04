using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;
using System;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PassController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PassController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Получить все пропуска, в том числе активные и закрытые.
        /// Пример: GET /api/Pass
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllPasses()
        {
            var passes = await _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                .Include(p => p.Store)
                .Include(p => p.PassTransaction)
                .ToListAsync();

            return Ok(passes);
        }

        /// <summary>
        /// Получить конкретный пропуск по Id
        /// Пример: GET /api/Pass/5
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPassById(int id)
        {
            var pass = await _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                .Include(p => p.Store)
                .Include(p => p.PassTransaction)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pass == null)
            {
                return NotFound("Пропуск не найден.");
            }

            return Ok(pass);
        }

        /// <summary>
        /// Закрыть пропуск (IsClosed = true).
        /// Пример: POST /api/Pass/5/close
        /// Body: { "closeReason": "Истек срок" }
        /// </summary>
        [HttpPost("{id}/close")]
        public async Task<IActionResult> ClosePass(int id, [FromBody] ClosePassDto dto)
        {
            var pass = await _context.Passes.FindAsync(id);
            if (pass == null)
            {
                return NotFound("Пропуск не найден.");
            }

            if (pass.IsClosed)
            {
                return BadRequest("Пропуск уже закрыт.");
            }

            pass.IsClosed = true;
            pass.CloseReason = dto.CloseReason;
            _context.Passes.Update(pass);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    /// <summary>
    /// DTO для закрытия пропуска
    /// </summary>
    public class ClosePassDto
    {
        [Required]
        public string CloseReason { get; set; } = string.Empty;
    }
}
