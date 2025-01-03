using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.Text.RegularExpressions;
using System.ComponentModel.DataAnnotations;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QueueController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public QueueController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Создать новый талон (Active).
        /// POST /api/Queue/create-token?type=P
        /// </summary>
        [HttpPost("create-token")]
        public async Task<IActionResult> CreateToken([FromQuery] string type)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Console.WriteLine($"[DEBUG] CreateToken: userId from token = {userId}");

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Не удалось определить пользователя (NameIdentifier).");
            }

            // Проверяем, нет ли уже Active
            var existingActive = await _context.PassTransactions
                .FirstOrDefaultAsync(t => t.UserId == userId && t.Status == "Active");
            if (existingActive != null)
            {
                return BadRequest($"У вас уже есть активный талон: {existingActive.Token}. " +
                                  "Сначала закройте или сохраните (Pending) его.");
            }

            // Определяем "сегодня" (UTC)
            DateTime today = DateTime.UtcNow.Date;

            // Находим последний талон за сегодня
            var lastTodayTransaction = await _context.PassTransactions
                .Where(t => t.TokenType == type && t.CreatedAt.Date == today)
                .OrderByDescending(t => t.Id)
                .FirstOrDefaultAsync();

            int nextNum = 1;
            if (lastTodayTransaction != null)
            {
                var match = Regex.Match(lastTodayTransaction.Token, @"(\d+)$");
                if (match.Success && int.TryParse(match.Groups[1].Value, out int parsedNumber))
                {
                    nextNum = parsedNumber + 1;
                }
            }

            string newToken = $"{type}{nextNum}";

            var transaction = new PassTransaction
            {
                Token = newToken,
                TokenType = type,
                UserId = userId,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.PassTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(new { token = newToken });
        }

        /// <summary>
        /// Закрыть талон (Active → Closed).
        /// POST /api/Queue/close-token
        /// </summary>
        [HttpPost("close-token")]
        public async Task<IActionResult> CloseActiveToken([FromBody] CloseTokenDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest("Токен не указан.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Console.WriteLine($"[DEBUG] CloseActiveToken: userId from token = {userId}");

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Не удалось определить пользователя.");

            var transaction = await _context.PassTransactions
                .FirstOrDefaultAsync(t => t.Token == dto.Token
                    && t.Status == "Active"
                    && t.UserId == userId);

            if (transaction == null)
                return NotFound("Активный талон не найден или принадлежит другому пользователю.");

            transaction.Status = "Closed";
            _context.PassTransactions.Update(transaction);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Сохранить транзакцию (Active → Pending).
        /// PUT /api/Queue/save-transaction
        /// </summary>
        [HttpPut("save-transaction")]
        public async Task<IActionResult> SaveTransaction([FromBody] SaveTransactionDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Console.WriteLine($"[DEBUG] SaveTransaction: userId from token = {userId}");

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Не удалось определить пользователя.");

            var transaction = await _context.PassTransactions
                .FirstOrDefaultAsync(t => t.Token == dto.Token
                    && t.Status == "Active"
                    && t.UserId == userId);

            if (transaction == null)
                return NotFound("Активный талон не найден или принадлежит другому пользователю.");

            var passType = await _context.PassTypes.FindAsync(dto.PassTypeId);
            if (passType == null)
                return BadRequest("Указанный тип пропуска (PassTypeId) не найден.");

            bool contractorExists = await _context.Contractors.AnyAsync(c => c.Id == dto.ContractorId);
            if (!contractorExists)
                return BadRequest("Указанный контрагент (ContractorId) не найден.");

            bool storeExists = await _context.Stores.AnyAsync(s => s.Id == dto.StoreId);
            if (!storeExists)
                return BadRequest("Указанная торговая точка (StoreId) не найдена.");

            transaction.ContractorId = dto.ContractorId;
            transaction.StoreId = dto.StoreId;
            transaction.PassTypeId = dto.PassTypeId;
            transaction.StartDate = dto.StartDate;
            transaction.EndDate = dto.EndDate;
            transaction.Position = dto.Position ?? string.Empty;
            transaction.Amount = passType.Cost;
            transaction.Status = "Pending";

            _context.PassTransactions.Update(transaction);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Транзакция сохранена (Pending).",
                Token = transaction.Token,
                TransactionId = transaction.Id
            });
        }

        /// <summary>
        /// Список всех транзакций (для демонстрации).
        /// GET /api/Queue/list-all
        /// </summary>
        [HttpGet("list-all")]
        public async Task<IActionResult> ListAll()
        {
            var allTransactions = await _context.PassTransactions
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(allTransactions);
        }
    }

    public class CloseTokenDto
    {
        public string Token { get; set; } = string.Empty;
    }

    public class SaveTransactionDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;

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
