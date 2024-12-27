using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Защита контроллера
    public class PassTransactionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PassTransactionController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Получить все транзакции (можно фильтровать по статусу на фронте).
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
        /// Получить транзакцию по её внутреннему Id (первичный ключ).
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
                return NotFound();

            return Ok(transaction);
        }

        /// <summary>
        /// Подтвердить оплату транзакции (меняем Status = "Paid").
        /// По желанию создаём реальный Pass (готовый пропуск) в таблице Passes.
        /// </summary>
        [HttpPost("{id}/confirm")]
        public async Task<IActionResult> ConfirmTransaction(int id)
        {
            var transaction = await _context.PassTransactions.FindAsync(id);
            if (transaction == null)
                return NotFound("Транзакция не найдена.");

            if (transaction.Status == "Paid")
                return BadRequest("Транзакция уже подтверждена как оплаченная.");

            // Меняем статус
            transaction.Status = "Paid";
            _context.PassTransactions.Update(transaction);

            // Создаём запись в Pass (как пропуск)
            var pass = new Pass
            {
                UniquePassId = Guid.NewGuid().ToString(),
                ContractorId = transaction.ContractorId,
                StoreId = transaction.StoreId,
                PassTypeId = transaction.PassTypeId,
                StartDate = transaction.StartDate,
                EndDate = transaction.EndDate,
                Position = transaction.Position, // берем из транзакции
                TransactionDate = DateTime.UtcNow,
                IsClosed = false
                // PassTransactionId удалено
            };

            _context.Passes.Add(pass);
            await _context.SaveChangesAsync();

            // Обновляем транзакцию с PassId
            transaction.PassId = pass.Id;
            _context.PassTransactions.Update(transaction);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Транзакция подтверждена, пропуск создан.",
                Transaction = transaction
            });
        }

        /*
        // (УДАЛЕНО/закомментировано)
        // Старый метод CreatePassTransaction с GenerateToken,
        // чтобы логика не пересекалась с QueueController + sequence.

        // [HttpPost]
        // public async Task<IActionResult> CreatePassTransaction([FromBody] CreatePassTransactionDto dto)
        // {
        //     ... (закомментировано)
        // }

        // private async Task<string> GenerateToken(int storeId)
        // {
        //    ... (закомментировано)
        // }
        */
    }
}
