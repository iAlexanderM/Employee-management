using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;
using System.Security.Claims;
using Npgsql;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Защита контроллера
    public class QueueController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtPassTokenService _passTokenService;

        public QueueController(ApplicationDbContext context, JwtPassTokenService passTokenService)
        {
            _context = context;
            _passTokenService = passTokenService;
        }

        //----------------------------------------------------------------------
        //    1)  Классические методы "current-token", "active-token", etc.
        //         чтобы фронт (QueueService) не падал с 404
        //----------------------------------------------------------------------

        /// <summary>
        /// Получить текущий номер талона для указанного типа (например, 'P').
        /// Используется на фронте (QueueComponent) → getCurrentToken('P').
        /// Логика: ищем последний за сегодня и берём его номер, иначе 0.
        /// </summary>
        [HttpGet("current-token/{type}")]
        public async Task<IActionResult> GetCurrentToken(string type)
        {
            var today = DateTime.UtcNow.Date;
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var lastTransaction = await _context.PassTransactions
                .Where(t => t.TokenType == type && t.CreatedAt.Date == today && t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            int currentNumber = 0;
            if (lastTransaction != null)
            {
                // Предполагаем, что Token = "P3" → берём substring(1..)
                if (lastTransaction.Token.Length > 1)
                {
                    var numericPart = lastTransaction.Token.Substring(1);
                    if (int.TryParse(numericPart, out int parsedNum))
                    {
                        currentNumber = parsedNum;
                    }
                }
            }

            return Ok(new { currentToken = $"{type}{currentNumber}" });
        }

        /// <summary>
        /// Список ожидающих (Pending) для текущего пользователя.
        /// Фронт: /api/Queue/pending-tokens
        /// </summary>
        [HttpGet("pending-tokens")]
        public async Task<IActionResult> GetPendingTokens()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var tokens = await _context.PassTransactions
                .Where(t => t.Status == "Pending" && t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Token,
                    t.CreatedAt
                })
                .ToListAsync();

            return Ok(tokens);
        }

        /// <summary>
        /// Получить "активный" талон для текущего пользователя. 
        /// </summary>
        [HttpGet("active-token")]
        public async Task<IActionResult> GetActiveToken()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var activeTransaction = await _context.PassTransactions
                .Where(t => t.Status == "Active" && t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (activeTransaction == null)
                return Ok(new { ActiveToken = (string?)null });

            return Ok(new { ActiveToken = activeTransaction.Token });
        }

        /// <summary>
        /// Закрыть талон (Pending) → Closed для текущего пользователя.
        /// Фронт: POST /api/Queue/close-token  body: { token:"P3" }
        /// </summary>
        [HttpPost("close-token")]
        public async Task<IActionResult> CloseActiveToken([FromBody] CloseTokenDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest("Токен не указан.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var transaction = await _context.PassTransactions
                .FirstOrDefaultAsync(t => t.Token == dto.Token && t.Status == "Pending" && t.UserId == userId);

            if (transaction == null)
                return NotFound("Талон не найден или уже не Pending.");

            transaction.Status = "Closed";
            _context.PassTransactions.Update(transaction);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Активировать талон (из Pending в Active) для текущего пользователя.
        /// Фронт: POST /api/Queue/activate-token, body: { token: "P3" }
        /// </summary>
        [HttpPost("activate-token")]
        public async Task<IActionResult> ActivateToken([FromBody] ActivateTokenDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest("Токен не указан.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Проверяем, есть ли уже активный талон для пользователя
            var existingActive = await _context.PassTransactions
                .FirstOrDefaultAsync(t => t.Status == "Active" && t.UserId == userId);

            if (existingActive != null)
            {
                return BadRequest($"Талон {existingActive.Token} уже активен. Закройте его перед активацией нового.");
            }

            var token = dto.Token;

            // Ищем транзакцию и меняем статус
            var transaction = await _context.PassTransactions
                .FirstOrDefaultAsync(t => t.Token == token && t.Status == "Pending" && t.UserId == userId);

            if (transaction == null)
                return NotFound("Талон не найден или уже не Pending.");

            transaction.Status = "Active";
            _context.PassTransactions.Update(transaction);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        //----------------------------------------------------------------------
        //    2)  JWT-подход: GET new-token/{type}, POST save-transaction
        //----------------------------------------------------------------------

        /// <summary>
        /// (JWT-подход) Получить подписанный талон (type="P", num=3) из sequence,
        /// НЕ создаём запись в PassTransactions. 
        /// Фронт: GET /api/Queue/new-token/P
        /// Возвращаем signedToken = "...".
        /// </summary>
        [HttpGet("new-token/{type}")]
        public async Task<IActionResult> GetNextToken(string type)
        {
            // 1) Получаем следующий номер из sequence
            var connection = _context.Database.GetDbConnection() as NpgsqlConnection;
            if (connection == null) throw new Exception("Не удалось получить NpgsqlConnection.");

            if (connection.State != System.Data.ConnectionState.Open)
                await connection.OpenAsync();

            long nextVal;
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = "SELECT nextval('pass_token_seq')";
                var obj = await cmd.ExecuteScalarAsync();
                nextVal = (long)obj;
            }

            // Получаем UserId из Claims
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Пользователь не аутентифицирован.");
            }

            var signedToken = _passTokenService.GeneratePassToken(type, nextVal, userId);
            return Ok(new { signedToken });
        }

        /// <summary>
        /// (JWT-подход) Сохранить транзакцию (PassTransaction),
        /// используя подписанный токен (dto.SignedToken).
        /// В теле: { signedToken, contractorId, storeId, passTypeId, startDate, endDate, ... }
        /// Создаём запись в PassTransactions (Status=Pending).
        /// </summary>
        [HttpPost("save-transaction")]
        public async Task<IActionResult> SaveTransaction([FromBody] SaveTransactionJwtDto dto)
        {
            // 1) Валидируем подписанный токен
            var (isValid, error, talonType, talonNum, tokenUserId) =
                _passTokenService.ValidatePassToken(dto.SignedToken);

            if (!isValid)
                return BadRequest($"Invalid token: {error}");

            // Проверка соответствия userId
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(tokenUserId)
                && !string.IsNullOrWhiteSpace(currentUserId)
                && tokenUserId != currentUserId)
            {
                return BadRequest("Этот талон принадлежит другому пользователю.");
            }

            // Формируем Token="P3"
            var tokenString = $"{talonType}{talonNum}";

            // 2) Проверяем поля
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var passType = await _context.PassTypes.FindAsync(dto.PassTypeId);
            if (passType == null)
                return BadRequest("Указанный тип пропуска (PassTypeId) не найден.");

            if (!await _context.Contractors.AnyAsync(c => c.Id == dto.ContractorId))
                return BadRequest("Указанный контрагент (ContractorId) не найден.");

            if (!await _context.Stores.AnyAsync(s => s.Id == dto.StoreId))
                return BadRequest("Указанная торговая точка (StoreId) не найдена.");

            // 3) Проверка на повтор
            bool alreadyExists = await _context.PassTransactions.AnyAsync(t => t.Token == tokenString);
            if (alreadyExists)
                return BadRequest($"Транзакция с Token={tokenString} уже существует!");

            // 4) Создаём запись в PassTransactions
            var transaction = new PassTransaction
            {
                Token = tokenString,
                TokenType = talonType ?? "P",
                ContractorId = dto.ContractorId,
                StoreId = dto.StoreId,
                PassTypeId = dto.PassTypeId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Amount = passType.Cost,
                Position = dto.Position ?? string.Empty,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UserId = currentUserId ?? string.Empty // Присваиваем текущего пользователя
            };

            _context.PassTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Транзакция успешно сохранена",
                TransactionId = transaction.Id,
                Token = transaction.Token
            });
        }
    }

    /// <summary>
    /// DTO для закрытия талона (close-token).
    /// </summary>
    public class CloseTokenDto
    {
        public string Token { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO для (JWT-подход) сохранения транзакции.
    /// </summary>
    public class SaveTransactionJwtDto
    {
        public string SignedToken { get; set; } = string.Empty;
        public int ContractorId { get; set; }
        public int StoreId { get; set; }
        public int PassTypeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Position { get; set; }
    }
}
