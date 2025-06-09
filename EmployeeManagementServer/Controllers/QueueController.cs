using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.Text.RegularExpressions;
using System;
using System.Linq;
using System.Threading.Tasks;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.AspNetCore.SignalR;
using EmployeeManagementServer.Hubs;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class QueueController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<QueueHub> _hubContext;
        private readonly IQueueService _queueService;

        public QueueController(ApplicationDbContext context, IHubContext<QueueHub> hubContext, IQueueService queueService)
        {
            _context = context;
            _hubContext = hubContext;
            _queueService = queueService;
        }

        [HttpPost("create-token")]
        public async Task<IActionResult> CreateToken([FromQuery] string type)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Console.WriteLine($"[DEBUG] CreateToken: userId from token = {userId}");

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Не удалось определить пользователя (NameIdentifier).");
            }

            DateTime today = DateTime.UtcNow.Date;

            var existingActive = await _context.QueueTokens
                .FirstOrDefaultAsync(t => t.UserId == userId && t.Status == "Active");

            if (existingActive != null)
            {
                if (existingActive.CreatedDate != today)
                {
                    existingActive.Status = "Closed"; 
                    _context.QueueTokens.Update(existingActive);
                    Console.WriteLine($"[INFO] Automatically closed stale active token {existingActive.Token} for user {userId}");
                }
                else
                {
                    return BadRequest($"У вас уже есть активный талон на сегодня: {existingActive.Token}. Его нужно закрыть вручную.");
                }
            }

            var lastTodayToken = await _context.QueueTokens
                .Where(t => t.TokenType == type && t.CreatedDate == today)
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
                CreatedAt = DateTime.UtcNow,
                CreatedDate = today
            };

            _context.QueueTokens.Add(token);

            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("QueueUpdated");

            return Ok(new { token = newToken });
        }

        [HttpPost("close-token")]
        public async Task<IActionResult> CloseActiveToken([FromBody] CloseTokenDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest("Токен не указан.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Не удалось определить пользователя.");

            var success = await _queueService.CloseActiveTokenAsync(userId, dto.Token);

            if (success)
            {
                await _hubContext.Clients.All.SendAsync("QueueUpdated");
                return Ok(new { message = "Талон успешно закрыт." });
            }
            else
            {
                return NotFound("Активный талон очереди не найден или принадлежит другому пользователю.");
            }
        }

        [HttpGet("list-all-tokens")]
        public async Task<IActionResult> ListAllTokens([FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            if (page < 1 || pageSize < 1)
                return BadRequest("Параметры страницы и размера должны быть больше нуля.");

            DateTime today = DateTime.UtcNow.Date;

            var query = _context.QueueTokens
                .Where(t => t.Status == "Active" && t.CreatedAt.Date == today)
                .Where(t => !_context.PassTransactions.Any(pt =>
                    pt.Token == t.Token &&
                    pt.Status == "Оплачено" &&
                    pt.CreatedAt.Date == t.CreatedAt.Date))
                .OrderByDescending(t => t.CreatedAt);

            int total = await query.CountAsync();
            var tokens = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { total, tokens });
        }
    }
}
