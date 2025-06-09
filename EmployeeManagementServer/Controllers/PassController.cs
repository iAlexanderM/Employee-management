using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using EmployeeManagementServer.Models.DTOs;
using AutoMapper;
using DocumentFormat.OpenXml.Spreadsheet;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PassController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PassController> _logger;
        private readonly IMapper _mapper;

        public PassController(ApplicationDbContext context, ILogger<PassController> logger, IMapper mapper)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPasses()
        {
            _logger.LogInformation("Получен запрос на получение всех пропусков.");
            var passes = await _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                .Include(p => p.Store)
                .Include(p => p.PassTransaction)
                .Include(p => p.ClosedByUser)
                .ToListAsync();

            _logger.LogInformation("Возвращено {Count} пропусков.", passes.Count);
            return Ok(passes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPassById(int id)
        {
            _logger.LogInformation("Получен запрос на получение пропуска с ID {Id}.", id);
            var pass = await _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                .Include(p => p.Store)
                .Include(p => p.PassTransaction)
                .Include(p => p.ClosedByUser)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pass == null)
            {
                _logger.LogWarning("Пропуск с ID {Id} не найден.", id);
                return NotFound("Пропуск не найден.");
            }

            return Ok(pass);
        }

        [HttpGet("by-transaction-id/{transactionId}")]
        public async Task<IActionResult> GetPassesByTransactionId(int transactionId)
        {
            _logger.LogInformation("Получен запрос на получение выданных пропусков для transactionId {TransactionId}.", transactionId);

            var passes = await _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                    .ThenInclude(c => c.Photos)
                .Include(p => p.Store)
                .Include(p => p.PassTransaction)
                .Include(p => p.ClosedByUser)
                .Where(p => p.PassTransactionId == transactionId && p.PrintStatus == "Printed")
                .ToListAsync();

            if (!passes.Any())
            {
                _logger.LogInformation("Напечатанные пропуска для transactionId {TransactionId} не найдены.", transactionId);
                return NotFound($"Напечатанные пропуска для транзакции с ID {transactionId} не найдены.");
            }

            _logger.LogInformation("Найдено {Count} выданных пропусков для transactionId {TransactionId}.", passes.Count, transactionId);
            return Ok(passes);
        }

        [HttpGet("by-transaction-id/{transactionId}/pending")]
        public async Task<IActionResult> GetPendingPassesByTransactionId(int transactionId)
        {
            _logger.LogInformation("Получен запрос на получение пропусков в очереди для transactionId {TransactionId}.", transactionId);

            var passes = await _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                    .ThenInclude(c => c.Photos)
                .Include(p => p.Store)
                .Include(p => p.PassTransaction)
                .Where(p => p.PassTransactionId == transactionId && p.PrintStatus == "PendingPrint")
                .ToListAsync();

            if (!passes.Any())
            {
                _logger.LogInformation("Пропуска в очереди для transactionId {TransactionId} не найдены.", transactionId);
                return NotFound($"Пропуска в очереди для транзакции с ID {transactionId} не найдены.");
            }

            _logger.LogInformation("Найдено {Count} пропусков в очереди для transactionId {TransactionId}.", passes.Count, transactionId);
            return Ok(passes);
        }

        [HttpGet("print-queue")]
        public async Task<IActionResult> GetPrintQueue(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] int? contractorId = null)
        {
            if (page < 1 || pageSize < 1)
            {
                _logger.LogWarning("Некорректные параметры пагинации: page={Page}, pageSize={PageSize}.", page, pageSize);
                return BadRequest("Параметры пагинации должны быть больше 0.");
            }

            _logger.LogInformation("Получен запрос на получение очереди печати с page={Page}, pageSize={PageSize}, contractorId={ContractorId}.", page, pageSize, contractorId);

            var query = _context.PassTransactions
                .Include(pt => pt.Passes)
                    .ThenInclude(p => p.PassType)
                .Include(pt => pt.Passes)
                    .ThenInclude(p => p.Contractor)
                .Include(pt => pt.Passes)
                    .ThenInclude(p => p.Store)
                .Include(pt => pt.User)
                .Where(pt => pt.Passes.Any(p => p.PrintStatus == "PendingPrint"));

            if (contractorId.HasValue)
            {
                query = query.Where(pt => pt.Passes.Any(p => p.ContractorId == contractorId.Value));
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(pt => pt.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(pt => new
                {
                    transactionId = pt.Id,
                    manager = pt.User != null ? pt.User.UserName : "Admin",
                    queueNumber = pt.Token,
                    serviceType = "Пропуск",
                    passCount = pt.Passes.Count(p => p.PrintStatus == "PendingPrint"),
                    passTypes = pt.Passes
                        .Where(p => p.PrintStatus == "PendingPrint")
                        .Select(p => new
                        {
                            id = p.PassTypeId,
                            color = p.PassType.Color
                        }).ToList(),
                    actions = "Печатать"
                })
                .ToListAsync();

            _logger.LogInformation("Возвращено {Count} элементов очереди печати, всего {Total}.", items.Count, total);
            return Ok(new { items, total });
        }

        [HttpGet("issued")]
        public async Task<IActionResult> GetIssuedPasses(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] int? contractorId = null)
        {
            if (page < 1 || pageSize < 1)
            {
                _logger.LogWarning("Некорректные параметры пагинации: page={Page}, pageSize={PageSize}.", page, pageSize);
                return BadRequest("Параметры пагинации должны быть больше 0.");
            }

            _logger.LogInformation("Получен запрос на получение выданных пропусков с page={Page}, pageSize={PageSize}, contractorId={ContractorId}.", page, pageSize, contractorId);

            var query = _context.PassTransactions
                .Include(pt => pt.Passes)
                    .ThenInclude(p => p.PassType)
                .Include(pt => pt.User)
                .Where(pt => pt.Passes.Any(p => p.PrintStatus == "Printed"));

            if (contractorId.HasValue)
            {
                query = query.Where(pt => pt.Passes.Any(p => p.ContractorId == contractorId.Value));
            }

            var total = await query.CountAsync();
            var transactions = await query
                .OrderByDescending(pt => pt.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = transactions.Select(pt => new
            {
                transactionId = pt.Id,
                manager = pt.User != null ? pt.User.UserName : "Admin",
                queueNumber = pt.Token,
                serviceType = GetServiceType(pt.TokenType), 
                passCount = pt.Passes.Count(p => p.PrintStatus == "Printed"),
                passTypes = pt.Passes
                    .Where(p => p.PrintStatus == "Printed")
                    .Select(p => new
                    {
                        id = p.PassTypeId,
                        color = p.PassType.Color
                    }).ToList(),
                actions = "Печатать"
            }).ToList();

            _logger.LogInformation("Возвращено {Count} выданных пропусков, всего {Total}.", items.Count, total);
            return Ok(new { items, total });
        }

        [HttpPost("issue-by-transaction-id/{transactionId}")]
        public async Task<IActionResult> IssuePassesByTransactionId(int transactionId)
        {
            _logger.LogInformation("Получен запрос на выдачу пропусков для transactionId {TransactionId}.", transactionId);

            var passes = await _context.Passes
                .Where(p => p.PassTransactionId == transactionId && p.PrintStatus == "PendingPrint")
                .ToListAsync();

            if (!passes.Any())
            {
                _logger.LogInformation("Пропуска в очереди для transactionId {TransactionId} не найдены.", transactionId);
                return NotFound($"Пропуска в очереди для транзакции с ID {transactionId} не найдены.");
            }

            foreach (var pass in passes)
            {
                pass.PrintStatus = "Printed";
            }

            _context.Passes.UpdateRange(passes);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Все пропуска ({Count}) для transactionId {TransactionId} помечены как Printed.", passes.Count, transactionId);
            return NoContent();
        }

        [HttpPost("{id}/issue")]
        public async Task<IActionResult> IssuePass(int id)
        {
            _logger.LogInformation("Получен запрос на выдачу пропуска с ID {Id}.", id);

            var pass = await _context.Passes.FindAsync(id);
            if (pass == null)
            {
                _logger.LogWarning("Пропуск с ID {Id} не найден.", id);
                return NotFound("Пропуск не найден.");
            }

            if (pass.PrintStatus == "Printed")
            {
                _logger.LogWarning("Пропуск с ID {Id} уже напечатан.", id);
                return BadRequest("Пропуск уже напечатан.");
            }

            pass.PrintStatus = "Printed";
            _context.Passes.Update(pass);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Пропуск с ID {Id} успешно выдан.", id);
            return NoContent();
        }

        [HttpPost("{id}/close")]
        public async Task<IActionResult> ClosePass(int id, [FromBody] ClosePassDto dto)
        {
            _logger.LogInformation("Получен запрос на закрытие пропуска с ID {Id}, CloseReason: {CloseReason}", id, dto.CloseReason);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Некорректные данные для закрытия пропуска: {Errors}", ModelState);
                return BadRequest(ModelState);
            }

            var pass = await _context.Passes
                .FirstOrDefaultAsync(p => p.Id == id);
            if (pass == null)
            {
                _logger.LogWarning("Пропуск с ID {Id} не найден.", id);
                return NotFound("Пропуск не найден.");
            }

            if (pass.PassStatus == "Closed")
            {
                _logger.LogWarning("Пропуск с ID {Id} уже закрыт.", id);
                return BadRequest("Пропуск уже закрыт.");
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Не удалось определить пользователя для закрытия пропуска с ID {Id}.", id);
                return Unauthorized("Не удалось определить пользователя.");
            }

            pass.PassStatus = "Closed";
            pass.IsClosed = true;
            pass.CloseReason = dto.CloseReason;
            pass.CloseDate = DateTime.UtcNow;
            pass.ClosedByUserId = userId;

            _context.Passes.Update(pass);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Пропуск с ID {Id} успешно закрыт пользователем с ID: {UserId}", id, userId);
            return NoContent();
        }

        [HttpPost("{id}/reopen")]
        public async Task<IActionResult> ReopenPass(int id)
        {
            _logger.LogInformation("Получен запрос на открытие пропуска с ID {Id}.", id);

            var pass = await _context.Passes.FindAsync(id);
            if (pass == null)
            {
                _logger.LogWarning("Пропуск с ID {Id} не найден для открытия.", id);
                return NotFound("Пропуск не найден.");
            }

            bool isCurrentlyClosed = pass.PassStatus == "Closed" || pass.IsClosed;
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!isCurrentlyClosed)
            {
                _logger.LogWarning("Пропуск с ID {Id} уже открыт или не был закрыт.", id);
                return BadRequest("Пропуск уже открыт или не был закрыт.");
            }

            pass.PassStatus = "Active";
            pass.IsClosed = false;
            pass.CloseReason = null; 
            pass.CloseDate = null;
            pass.ClosedByUserId = userId;

            _context.Passes.Update(pass);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Пропуск с ID {Id} успешно открыт.", id);
            return NoContent(); 
        }

        private string GetServiceType(string tokenType)
        {
            return tokenType switch
            {
                "P" => "Пропуск",
                "Д" => "Доставка",
                "С" => "Сервис",
                _ => "Неизвестный тип"
            };
        }
    }
}