using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using EmployeeManagementServer.Hubs; // Подключаем QueueHub
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PassTransactionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<QueueHub> _hubContext;
        private readonly IPassTransactionSearchService _searchService;

        public PassTransactionController(ApplicationDbContext context, IHubContext<QueueHub> hubContext, IPassTransactionSearchService searchService)
        {
            _context = context;
            _hubContext = hubContext;
            _searchService = searchService;
        }

        /// <summary>
        /// Создать транзакцию на основе талона очереди.
        /// POST /api/PassTransaction/create
        /// </summary>
        [HttpPost("create")]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest("Талон очереди не указан.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Console.WriteLine($"[DEBUG] CreateTransaction: userId = {userId}");

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Не удалось определить пользователя.");

            // Находим активный талон у пользователя
            var queueToken = await _context.QueueTokens
                .FirstOrDefaultAsync(q => q.Token == dto.Token && q.UserId == userId && q.Status == "Active");

            if (queueToken == null)
                return BadRequest("Активный талон очереди не найден.");

            if (!await _context.Contractors.AnyAsync(c => c.Id == dto.ContractorId))
                return BadRequest("Указанный ContractorId не существует.");

            if (!await _context.Stores.AnyAsync(s => s.Id == dto.StoreId))
                return BadRequest("Указанный StoreId не существует.");

            var passType = await _context.PassTypes.FindAsync(dto.PassTypeId);
            if (passType == null)
                return BadRequest("Указанный PassTypeId не существует.");

            // Создаем транзакцию
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

            // Обновляем статус талона: теперь он становится "Отправлен на оплату"
            queueToken.Status = "Отправлен на оплату";
            _context.QueueTokens.Update(queueToken);

            await _context.SaveChangesAsync();

            // Оповещаем клиентов, что очередь изменилась
            await _hubContext.Clients.All.SendAsync("QueueUpdated");

            return Ok(new { Message = "Транзакция создана.", transactionId = transaction.Id });
        }

        /// <summary>
        /// Получить все транзакции с пагинацией.
        /// GET /api/PassTransaction?page=1&pageSize=25
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllPassTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
                return BadRequest("Параметры страницы и размера должны быть больше нуля.");

            int skip = (page - 1) * pageSize;
            int total = await _context.PassTransactions.CountAsync();

            var transactions = await _context.PassTransactions
                .Include(t => t.Contractor)
                .Include(t => t.Store)
                .Include(t => t.PassType)
                .Include(t => t.User)
                .Include(t => t.Pass)
                .OrderByDescending(t => t.CreatedAt)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { total, transactions });
        }

        /// <summary>
        /// Получить транзакцию по Id.
        /// GET /api/PassTransaction/{id}
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
        /// Подтвердить транзакцию (Pending → Paid) и создать новый Pass.
        /// POST /api/PassTransaction/{id}/confirm
        /// </summary>
        [HttpPost("{id}/confirm")]
        public async Task<IActionResult> ConfirmTransaction(int id)
        {
            var transaction = await _context.PassTransactions.FirstOrDefaultAsync(t => t.Id == id);
            if (transaction == null)
                return NotFound("Транзакция не найдена.");

            if (transaction.Status == "Paid")
                return BadRequest("Транзакция уже оплачена.");

            if (transaction.Status != "Pending")
                return BadRequest("Транзакция должна быть в статусе Pending, чтобы оплатить.");

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

            return Ok(new { Message = $"Транзакция {transaction.Token} оплачена, пропуск создан.", Transaction = transaction });
        }

        /// <summary>
        /// Обновить транзакцию в статусе Pending.
        /// PUT /api/PassTransaction/{id}/update
        /// </summary>
        [HttpPut("{id}/update")]
        public async Task<IActionResult> UpdatePendingTransaction(int id, [FromBody] UpdatePendingDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var transaction = await _context.PassTransactions.FirstOrDefaultAsync(t => t.Id == id);
            if (transaction == null)
                return NotFound("Транзакция не найдена.");

            if (transaction.Status != "Pending")
                return BadRequest("Редактировать можно только транзакцию в статусе Pending.");

            var passType = await _context.PassTypes.FindAsync(dto.PassTypeId);
            if (passType == null)
                return BadRequest("Тип пропуска не найден.");

            if (!await _context.Contractors.AnyAsync(c => c.Id == dto.ContractorId))
                return BadRequest("Контрагент не найден.");

            if (!await _context.Stores.AnyAsync(s => s.Id == dto.StoreId))
                return BadRequest("Торговая точка не найдена.");

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

        /// <summary>
        /// Поиск транзакций с пагинацией.
        /// GET /api/PassTransaction/search?page=1&pageSize=25&<...фильтры...>
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchPassTransactions([FromQuery] PassTransactionSearchDto searchDto, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
                return BadRequest("Неверные параметры страницы или размера.");

            int skip = (page - 1) * pageSize;
            var result = await _searchService.SearchPassTransactionsAsync(searchDto, skip, pageSize);
            return Ok(new { total = result.TotalCount, transactions = result.Transactions });
        }
    }

    // DTO для создания транзакции
    public class CreateTransactionDto
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

    // DTO для обновления транзакции в статусе Pending
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
