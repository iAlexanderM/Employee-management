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
using EmployeeManagementServer.Hubs; // Подключаем ваш QueueHub

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class QueueController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<QueueHub> _hubContext;

        public QueueController(ApplicationDbContext context, IHubContext<QueueHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
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

            // Проверяем, нет ли уже Active-токена у этого пользователя
            var existingActive = await _context.QueueTokens
                .FirstOrDefaultAsync(t => t.UserId == userId && t.Status == "Active");
            if (existingActive != null)
            {
                return BadRequest($"У вас уже есть активный талон: {existingActive.Token}.");
            }

            // Берем «сегодня» (UTC), чтобы ежедневно обнулять нумерацию
            DateTime today = DateTime.UtcNow.Date;

            // Находим последний талон за сегодня (по TokenType)
            var lastTodayToken = await _context.QueueTokens
                .Where(t => t.TokenType == type && t.CreatedAt.Date == today)
                .OrderByDescending(t => t.Id)
                .FirstOrDefaultAsync();

            int nextNum = 1;
            if (lastTodayToken != null)
            {
                // Парсим числовую часть из "P1", "P2" и т.д.
                var match = Regex.Match(lastTodayToken.Token, @"(\d+)$");
                if (match.Success && int.TryParse(match.Groups[1].Value, out int parsedNumber))
                {
                    nextNum = parsedNumber + 1;
                }
            }

            // Формируем новый талон, например, "P1"
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

            // Оповещаем всех клиентов, что очередь изменилась
            await _hubContext.Clients.All.SendAsync("QueueUpdated");

            return Ok(new { token = newToken });
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

            // Ставим статус Closed
            queueToken.Status = "Closed";
            _context.QueueTokens.Update(queueToken);
            await _context.SaveChangesAsync();

            // Оповещаем всех клиентов (талон закрыт)
            await _hubContext.Clients.All.SendAsync("QueueUpdated");

            return Ok(new { message = "Талон успешно закрыт." });
        }

        /// <summary>
        /// Список всех талонов (демо).
        /// GET /api/Queue/list-all-tokens
        /// </summary>
        [HttpGet("list-all-tokens")]
        public async Task<IActionResult> ListAllTokens()
        {
            DateTime today = DateTime.UtcNow.Date;

            var tokens = await _context.QueueTokens
                .Where(t => t.CreatedAt.Date == today && t.Status != "Closed")
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var tokensToShow = tokens.Where(t =>
                t.Status != "Отправлен на оплату"
                || !_context.PassTransactions.Any(pt => pt.Token == t.Token && pt.Status == "Paid")
            );

            return Ok(tokensToShow);
        }
    }
}
