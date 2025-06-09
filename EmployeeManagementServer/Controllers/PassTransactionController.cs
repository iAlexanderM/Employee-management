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
using EmployeeManagementServer.Hubs;
using EmployeeManagementServer.Services;
using EmployeeManagementServer.Models.DTOs;

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

        [HttpPost("create")]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Token) || dto.ContractorStorePasses.Count == 0)
                return BadRequest("Талон или данные о контрагентах/точках не указаны.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Не удалось определить пользователя.");

            var queueToken = await _context.QueueTokens
                .FirstOrDefaultAsync(q => q.Token == dto.Token && q.UserId == userId && q.Status == "Active");
            if (queueToken == null)
                return BadRequest($"Активный талон очереди {dto.Token} не найден для userId {userId}.");

            decimal totalAmount = 0;
            var contractorStorePasses = new List<ContractorStorePass>();

            foreach (var cspDto in dto.ContractorStorePasses)
            {
                if (!await _context.Contractors.AnyAsync(c => c.Id == cspDto.ContractorId))
                    return BadRequest($"Указанный ContractorId {cspDto.ContractorId} не существует.");
                if (!await _context.Stores.AnyAsync(s => s.Id == cspDto.StoreId))
                    return BadRequest($"Указанный StoreId {cspDto.StoreId} не существует.");
                var passType = await _context.PassTypes.FindAsync(cspDto.PassTypeId);
                if (passType == null)
                    return BadRequest($"Указанный PassTypeId {cspDto.PassTypeId} не существует.");

                totalAmount += passType.Cost;
                contractorStorePasses.Add(new ContractorStorePass
                {
                    ContractorId = cspDto.ContractorId,
                    StoreId = cspDto.StoreId,
                    PassTypeId = cspDto.PassTypeId,
                    Position = cspDto.Position ?? string.Empty,
                    OriginalPassId = cspDto.OriginalPassId
                });
            }

            var transaction = new PassTransaction
            {
                Token = dto.Token,
                TokenType = queueToken.TokenType,
                UserId = userId,
                Status = "Ожидает оплату",
                CreatedAt = DateTime.UtcNow,
                ContractorStorePasses = contractorStorePasses,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Amount = totalAmount,
                PaymentDate = null
            };

            _context.PassTransactions.Add(transaction);
            if (queueToken.Status == "Active")
            {
                queueToken.Status = "Отправлен на оплату";
                _context.QueueTokens.Update(queueToken);
            }

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("QueueUpdated");

            var responseDto = new PassTransactionResponseDto
            {
                Id = transaction.Id,
                Token = transaction.Token,
                TokenType = transaction.TokenType,
                UserId = transaction.UserId,
                User = transaction.User != null ? new ApplicationUser
                {
                    Id = transaction.User.Id,
                    UserName = transaction.User.UserName
                } : null,
                ContractorStorePasses = transaction.ContractorStorePasses.Select(csp => new ContractorStorePassDto
                {
                    ContractorId = csp.ContractorId,
                    Contractor = _context.Contractors.Find(csp.ContractorId)!,
                    StoreId = csp.StoreId,
                    Store = _context.Stores.Find(csp.StoreId)!,
                    PassTypeId = csp.PassTypeId,
                    PassType = _context.PassTypes.Find(csp.PassTypeId)!,
                    Position = csp.Position,
                    OriginalPassId = csp.OriginalPassId
                }).ToList(),
                StartDate = transaction.StartDate,
                EndDate = transaction.EndDate,
                Amount = transaction.Amount,
                Status = transaction.Status,
                CreatedAt = transaction.CreatedAt,
                Position = string.Join(", ", transaction.ContractorStorePasses.Select(csp => csp.Position)),
                PassId = transaction.PassId,
                PaymentDate = transaction.PaymentDate
            };

            return Ok(new
            {
                Message = "Транзакция создана.",
                TransactionId = transaction.Id,
                Transaction = responseDto,
                TotalAmount = totalAmount
            });
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchPassTransactions(
            [FromQuery] PassTransactionSearchDto searchDto,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
                return BadRequest("Неверные параметры страницы или размера.");

            int skip = (page - 1) * pageSize;
            var result = await _searchService.SearchPassTransactionsAsync(searchDto, skip, pageSize);
            return Ok(new { total = result.TotalCount, transactions = result.Transactions });
        }

        [HttpPost("{id}/confirm")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> ConfirmTransaction(int id)
        {
            var transaction = await _context.PassTransactions
                .Include(t => t.ContractorStorePasses)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (transaction == null)
                return NotFound("Транзакция не найдена.");

            if (transaction.Status == "Оплачено")
                return BadRequest("Транзакция уже оплачена.");

            transaction.Status = "Оплачено";
            transaction.PaymentDate = DateTime.UtcNow;
            _context.PassTransactions.Update(transaction);

            foreach (var csp in transaction.ContractorStorePasses)
            {
                var pass = new Pass
                {
                    UniquePassId = Guid.NewGuid().ToString(),
                    ContractorId = csp.ContractorId,
                    StoreId = csp.StoreId,
                    PassTypeId = csp.PassTypeId,
                    StartDate = transaction.StartDate,
                    EndDate = transaction.EndDate,
                    Position = csp.Position,
                    TransactionDate = DateTime.UtcNow,
                    IsClosed = false,
                    PrintStatus = "PendingPrint",
                    PassStatus = "Active",
                    PassTransactionId = transaction.Id
                };
                _context.Passes.Add(pass);

                if (csp.OriginalPassId.HasValue)
                {
                    var originalPass = await _context.Passes.FirstOrDefaultAsync(p => p.Id == csp.OriginalPassId.Value);
                    if (originalPass != null && !originalPass.IsClosed)
                    {
                        originalPass.PassStatus = "Closed";
                        originalPass.IsClosed = true;
                        originalPass.CloseReason = "Закрыто продлением";
                        originalPass.CloseDate = DateTime.UtcNow;
                        _context.Passes.Update(originalPass);
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = $"Транзакция {transaction.Token} оплачена, пропуска созданы.", Transaction = transaction });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTransactionById(int id)
        {
            var transaction = await _context.PassTransactions
                .Include(t => t.ContractorStorePasses)
                    .ThenInclude(csp => csp.Contractor)
                .Include(t => t.ContractorStorePasses)
                    .ThenInclude(csp => csp.Store)
                .Include(t => t.ContractorStorePasses)
                    .ThenInclude(csp => csp.PassType)
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (transaction == null)
                return NotFound("Транзакция не найдена.");

            var responseDto = new PassTransactionResponseDto
            {
                Id = transaction.Id,
                Token = transaction.Token,
                TokenType = transaction.TokenType,
                UserId = transaction.UserId,
                User = transaction.User != null ? new ApplicationUser
                {
                    Id = transaction.User.Id,
                    UserName = transaction.User.UserName
                } : null,
                ContractorStorePasses = transaction.ContractorStorePasses.Select(csp => new ContractorStorePassDto
                {
                    ContractorId = csp.ContractorId,
                    Contractor = csp.Contractor,
                    StoreId = csp.StoreId,
                    Store = csp.Store,
                    PassTypeId = csp.PassTypeId,
                    PassType = csp.PassType,
                    Position = csp.Position,
                    OriginalPassId = csp.OriginalPassId
                }).ToList(),
                StartDate = transaction.StartDate,
                EndDate = transaction.EndDate,
                Amount = transaction.Amount,
                Status = transaction.Status,
                CreatedAt = transaction.CreatedAt,
                Position = string.Join(", ", transaction.ContractorStorePasses.Select(csp => csp.Position)),
                PassId = transaction.PassId,
                PaymentDate = transaction.PaymentDate
            };

            return Ok(responseDto);
        }
    }
}