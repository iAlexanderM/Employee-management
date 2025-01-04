using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PassTransactionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PassTransactionController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Получить все транзакции (для администрирования).
        /// Пример: GET /api/PassTransaction
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllPassTransactions()
        {
            var transactions = await _context.PassTransactions
                .Include(t => t.Contractor)
                .Include(t => t.Store)
                .Include(t => t.PassType)
                .Include(t => t.User)
                .Include(t => t.Pass)
                .ToListAsync();

            return Ok(transactions);
        }

        /// <summary>
        /// Получить транзакцию по её внутреннему Id.
        /// Пример: GET /api/PassTransaction/5
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPassTransactionById(int id)
        {
            var transaction = await _context.PassTransactions
                .Include(t => t.Contractor)
                .Include(t => t.Store)
                .Include(t => t.PassType)
                .Include(t => t.User)
                .Include(t => t.Pass)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (transaction == null)
            {
                return NotFound();
            }

            return Ok(transaction);
        }

        /// <summary>
        /// Подтвердить оплату транзакции (Pending → Paid), при этом создается Pass.
        /// Пример: POST /api/PassTransaction/{id}/confirm
        /// </summary>
        [HttpPost("{id}/confirm")]
        public async Task<IActionResult> ConfirmTransaction(int id)
        {
            var transaction = await _context.PassTransactions.FirstOrDefaultAsync(t => t.Id == id);
            if (transaction == null)
            {
                return NotFound("Транзакция не найдена.");
            }

            if (transaction.Status == "Paid")
            {
                return BadRequest("Транзакция уже оплачена.");
            }
            if (transaction.Status != "Pending")
            {
                return BadRequest("Транзакция должна быть в статусе Pending, чтобы оплатить.");
            }

            transaction.Status = "Paid";
            _context.PassTransactions.Update(transaction);

            Pass pass = new Pass
            {
                UniquePassId = Guid.NewGuid().ToString(),
                ContractorId = transaction.ContractorId,
                StoreId = transaction.StoreId,
                PassTypeId = transaction.PassTypeId,
                StartDate = transaction.StartDate,
                EndDate = transaction.EndDate,
                Position = transaction.Position,
                TransactionDate = DateTime.UtcNow,
                IsClosed = false
            };
            _context.Passes.Add(pass);
            await _context.SaveChangesAsync();

            transaction.PassId = pass.Id;
            _context.PassTransactions.Update(transaction);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = $"Транзакция {transaction.Token} оплачена, пропуск создан.",
                Transaction = transaction
            });
        }

        /// <summary>
        /// Редактировать транзакцию в статусе Pending.
        /// Пример: PUT /api/PassTransaction/{id}/update
        /// Body:
        /// {
        ///   "contractorId": 321,
        ///   "storeId": 50,
        ///   "passTypeId": 6,
        ///   "startDate": "2024-12-30T10:00:00",
        ///   "endDate": "2024-12-30T19:00:00",
        ///   "position": "Старший менеджер"
        /// }
        /// </summary>
        /// <param name="id">ID транзакции</param>
        /// <param name="dto">Новые данные</param>
        /// <returns>JSON с сообщением об успехе</returns>
        [HttpPut("{id}/update")]
        public async Task<IActionResult> UpdatePendingTransaction(int id, [FromBody] UpdatePendingDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var transaction = await _context.PassTransactions.FirstOrDefaultAsync(t => t.Id == id);
            if (transaction == null)
            {
                return NotFound("Транзакция не найдена.");
            }

            if (transaction.Status != "Pending")
            {
                return BadRequest("Редактировать можно только транзакцию в статусе Pending.");
            }

            var passType = await _context.PassTypes.FindAsync(dto.PassTypeId);
            if (passType == null)
            {
                return BadRequest("Тип пропуска не найден.");
            }

            bool contractorExists = await _context.Contractors.AnyAsync(c => c.Id == dto.ContractorId);
            if (!contractorExists)
            {
                return BadRequest("Контрагент не найден.");
            }

            bool storeExists = await _context.Stores.AnyAsync(s => s.Id == dto.StoreId);
            if (!storeExists)
            {
                return BadRequest("Торговая точка не найдена.");
            }

            transaction.ContractorId = dto.ContractorId;
            transaction.StoreId = dto.StoreId;
            transaction.PassTypeId = dto.PassTypeId;
            transaction.StartDate = dto.StartDate;
            transaction.EndDate = dto.EndDate;
            transaction.Position = dto.Position ?? string.Empty;
            transaction.Amount = passType.Cost;

            _context.PassTransactions.Update(transaction);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Транзакция {transaction.Token} обновлена." });
        }
    }

    /// <summary>
    /// DTO для обновления Pending-транзакции
    /// </summary>
    public class UpdatePendingDto
    {
        [Required]
        public int ContractorId { get; set; }

        [Required]
        public int StoreId { get; set; }

        [Required]
        public int PassTypeId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public string? Position { get; set; }
    }
}
