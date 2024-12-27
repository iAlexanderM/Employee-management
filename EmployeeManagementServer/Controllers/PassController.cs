using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Защита контроллера
    public class PassController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ContractorService _contractorService;

        public PassController(ApplicationDbContext context, ContractorService contractorService)
        {
            _context = context;
            _contractorService = contractorService;
        }

        // DTO для закрытия пропуска
        public class ClosePassDto
        {
            [Required(ErrorMessage = "CloseReason является обязательным.")]
            [StringLength(500, ErrorMessage = "CloseReason не может превышать 500 символов.")]
            public string CloseReason { get; set; } = string.Empty;
        }

        // Создать пропуск
        [HttpPost]
        public async Task<IActionResult> CreatePass([FromBody] PassDto passDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Проверка существующего типа пропуска
            var passType = await _context.PassTypes.FindAsync(passDto.PassTypeId);
            if (passType == null)
                return NotFound("Тип пропуска не найден.");

            // Проверка на существующий активный пропуск
            var uniquePassId = $"{passDto.ContractorId}-{passDto.StoreId}";
            var existingPass = await _context.Passes
                .FirstOrDefaultAsync(p => p.UniquePassId == uniquePassId && !p.IsClosed);

            if (existingPass != null)
                return Conflict("Активный пропуск для этого контрагента и точки уже существует.");

            // Получение последнего фото (не документа)
            var mainPhotoPath = await _contractorService.GetLastNonDocumentPhotoAsync(passDto.ContractorId);

            var pass = new Pass
            {
                UniquePassId = uniquePassId,
                ContractorId = passDto.ContractorId,
                StoreId = passDto.StoreId,
                PassTypeId = passDto.PassTypeId,
                StartDate = passDto.StartDate,
                EndDate = passDto.StartDate.AddDays(passDto.DurationInDays),
                TransactionDate = DateTime.UtcNow,
                IsClosed = false,
                MainPhotoPath = mainPhotoPath,
                Position = passDto.Position // Добавляем должность
            };

            await _context.Passes.AddAsync(pass);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPassById), new { id = pass.Id }, pass);
        }

        // Получить пропуск по ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPassById(int id)
        {
            var pass = await _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                .Include(p => p.Store)
                .Include(p => p.PassTransaction) // Если требуется
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pass == null)
                return NotFound();

            return Ok(pass);
        }

        // Получить все пропуска
        [HttpGet]
        public async Task<IActionResult> GetAllPasses()
        {
            var passes = await _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                .Include(p => p.Store)
                .Include(p => p.PassTransaction) // Если требуется
                .Select(p => new
                {
                    p.Id,
                    p.UniquePassId,
                    RetailPoint = new
                    {
                        p.Store.Building,
                        p.Store.Floor,
                        p.Store.Line,
                        p.Store.StoreNumber,
                        FullName = $"{p.Store.Building}, Номер: {p.Store.StoreNumber}" // Для удобства
                    },
                    Contractor = new
                    {
                        p.Contractor.FirstName,
                        p.Contractor.LastName,
                        p.Contractor.MiddleName,
                        FullName = $"{p.Contractor.LastName} {p.Contractor.FirstName} {p.Contractor.MiddleName}" // Для удобства
                    },
                    p.Position,
                    PassTypeName = p.PassType.Name,
                    p.StartDate,
                    p.EndDate,
                    p.IsClosed,
                    p.MainPhotoPath
                })
                .ToListAsync();

            return Ok(passes);
        }

        // Закрыть пропуск
        [HttpPost("{id}/close")]
        public async Task<IActionResult> ClosePass(int id, [FromBody] ClosePassDto closePassDto)
        {
            if (closePassDto == null)
                return BadRequest("Данные для закрытия пропуска не предоставлены.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var pass = await _context.Passes.FindAsync(id);
            if (pass == null)
                return NotFound("Пропуск не найден.");

            if (pass.IsClosed)
                return BadRequest("Пропуск уже закрыт.");

            // Закрываем пропуск
            pass.IsClosed = true;
            pass.CloseReason = closePassDto.CloseReason;
            _context.Passes.Update(pass);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Получить пропуска по торговой точке
        [HttpGet("by-retail-point/{storeId}")]
        public async Task<IActionResult> GetPassesByStore(int storeId)
        {
            var passes = await _context.Passes
                .Where(p => p.StoreId == storeId)
                .Include(p => p.Contractor)
                .Include(p => p.PassType)
                .Include(p => p.PassTransaction) // Если требуется
                .Select(p => new
                {
                    p.Id,
                    p.UniquePassId,
                    ContractorName = $"{p.Contractor.LastName} {p.Contractor.FirstName} {p.Contractor.MiddleName}",
                    p.Position,
                    p.PassType.Name,
                    p.StartDate,
                    p.EndDate,
                    p.IsClosed,
                    p.MainPhotoPath
                })
                .ToListAsync();

            return Ok(passes);
        }

        // Получить пропуска по контрагенту
        [HttpGet("by-contractor/{contractorId}")]
        public async Task<IActionResult> GetPassesByContractor(int contractorId)
        {
            var passes = await _context.Passes
                .Where(p => p.ContractorId == contractorId)
                .Include(p => p.Store)
                .Include(p => p.PassType)
                .Include(p => p.PassTransaction) // Если требуется
                .Select(p => new
                {
                    p.Id,
                    p.UniquePassId,
                    RetailPoint = new
                    {
                        p.Store.Building,
                        p.Store.Floor,
                        p.Store.Line,
                        p.Store.StoreNumber,
                        FullName = $"{p.Store.Building}, Номер: {p.Store.StoreNumber}"
                    },
                    Contractor = new
                    {
                        p.Contractor.FirstName,
                        p.Contractor.LastName,
                        p.Contractor.MiddleName,
                        FullName = $"{p.Contractor.LastName} {p.Contractor.FirstName} {p.Contractor.MiddleName}"
                    },
                    p.Position,
                    p.PassType.Name,
                    p.StartDate,
                    p.EndDate,
                    p.IsClosed,
                    p.MainPhotoPath
                })
                .ToListAsync();

            return Ok(passes);
        }
    }
}
