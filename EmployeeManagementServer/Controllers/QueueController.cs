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
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]

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
            var existingActive = await _context.QueueTokens
                .FirstOrDefaultAsync(t => t.UserId == userId && t.Status == "Active");
            if (existingActive != null)
            {
                return BadRequest($"У вас уже есть активный талон: {existingActive.Token}. " +
                                  "Сначала закройте или сохраните его.");
            }

            // Определяем "сегодня" (UTC)
            DateTime today = DateTime.UtcNow.Date;

            // Находим последний талон за сегодня
            var lastTodayToken = await _context.QueueTokens
                .Where(t => t.TokenType == type && t.CreatedAt.Date == today)
                .OrderByDescending(t => t.Id)
                .FirstOrDefaultAsync();

            int nextNum = 1;
            if (lastTodayToken != null)
            {
                var match = Regex.Match(lastTodayToken.Token, @"(\d+)$");
                if (match.Success && int.TryParse(match.Groups[1].Value, out int parsedNumber))
                {
                    nextNum = parsedNumber + 1;
                }
            }

            string newToken = $"{type}{nextNum}";

            var token = new QueueToken
            {
                Token = newToken,
                TokenType = type,
                UserId = userId,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.QueueTokens.Add(token);
            await _context.SaveChangesAsync();

            return Ok(new { token = newToken });
        }

        /// <summary>
        /// Создать транзакцию на основе талона очереди.
        /// POST /api/Queue/create-transaction
        /// </summary>
        [HttpPost("create-transaction")]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest("Талон очереди не указан.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Console.WriteLine($"[DEBUG] CreateTransaction: userId from token = {userId}");

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Не удалось определить пользователя.");

            // Найти активный талон очереди
            var queueToken = await _context.QueueTokens
                .FirstOrDefaultAsync(q => q.Token == dto.Token && q.UserId == userId && q.Status == "Active");

            if (queueToken == null)
                return BadRequest("Активный талон очереди не найден.");

            // Проверить существование Contractor, Store и PassType
            var contractorExists = await _context.Contractors.AnyAsync(c => c.Id == dto.ContractorId);
            if (!contractorExists)
                return BadRequest("Указанный ContractorId не существует.");

            var storeExists = await _context.Stores.AnyAsync(s => s.Id == dto.StoreId);
            if (!storeExists)
                return BadRequest("Указанный StoreId не существует.");

            var passType = await _context.PassTypes.FindAsync(dto.PassTypeId);
            if (passType == null)
                return BadRequest("Указанный PassTypeId не существует.");

            // Создать транзакцию
            var transaction = new PassTransaction
            {
                Token = queueToken.Token,
                TokenType = queueToken.TokenType,
                UserId = userId,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                ContractorId = dto.ContractorId,
                StoreId = dto.StoreId,
                PassTypeId = dto.PassTypeId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Position = dto.Position ?? string.Empty,
                Amount = passType.Cost
            };

            _context.PassTransactions.Add(transaction);

            // Обновить статус талона очереди, если необходимо
            queueToken.Status = "Used";
            _context.QueueTokens.Update(queueToken);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Транзакция создана.",
                transactionId = transaction.Id
            });
        }

        /// <summary>
        /// Закрыть талон очереди (Active → Closed).
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

            var queueToken = await _context.QueueTokens
                .FirstOrDefaultAsync(q => q.Token == dto.Token && q.UserId == userId && q.Status == "Active");

            if (queueToken == null)
                return NotFound("Активный талон очереди не найден или принадлежит другому пользователю.");

            queueToken.Status = "Closed";
            _context.QueueTokens.Update(queueToken);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Талон успешно закрыт." });
        }

        /// <summary>
        /// Список всех транзакций (для демонстрации).
        /// GET /api/Queue/list-all-transactions
        /// </summary>
        [HttpGet("list-all-transactions")]
        public async Task<IActionResult> ListAllTransactions()
        {
            var allTransactions = await _context.PassTransactions
                .Include(t => t.Store) // Загружаем связанные данные Store
                .Include(t => t.Contractor) // Загружаем связанные данные Contractor
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Token,
                    t.CreatedAt,
                    StoreId = t.StoreId, // Возвращаем StoreId вместо Store.Name
                    ContractorId = t.ContractorId, // Возвращаем ContractorId вместо Contractor.Name
                    t.Amount,
                    t.Status
                })
                .ToListAsync();

            return Ok(allTransactions);
        }
    }
}
