using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using EmployeeManagementServer.Models;

namespace EmployeeManagementServer.Services
{
    /// <summary>
    /// Сервис для генерации JWT-токенов (access-token).
    /// </summary>
    public class JwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Генерирует access-токен для указанного пользователя (ApplicationUser).
        /// </summary>
        /// <param name="user">Пользователь, для которого выдаётся токен.</param>
        /// <returns>Строковое представление JWT.</returns>
        public string GenerateAccessToken(ApplicationUser user)
        {
            // Формируем список клеймов (Claims).
            var claims = new List<Claim>
            {
                // "sub" = user.UserName (например, "Admin").
                // Это чисто информационный клейм.
                new Claim(JwtRegisteredClaimNames.Sub, user.UserName ?? string.Empty),

                // "jti" = уникальный идентификатор конкретного токена (Jwt ID).
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),

                /*
                 * ВАЖНО: Добавляем стандартный клейм "nameid" (ClaimTypes.NameIdentifier),
                 * чтобы в контроллерах можно было вызывать:
                 *   var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                 * и получать именно GUID (Id) пользователя, а не "Admin".
                 */
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),

                /*
                 * (Опционально) Дублируем GUID в кастомный "userId",
                 * если в некоторых местах вы используете именно "userId".
                 */
                new Claim("userId", user.Id.ToString())
            };

            // Берём секретный ключ из конфигурации.
            var secretKey = _configuration["AppSettings:Token"] ?? string.Empty;
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            // Настраиваем, каким алгоритмом будем подписывать токен.
            var creds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // Формируем сам JWT, указываем Issuer, Audience, набор Claims и время жизни.
            var accessToken = new JwtSecurityToken(
                issuer: _configuration["AppSettings:Issuer"],   // Кто выпустил токен
                audience: _configuration["AppSettings:Audience"], // Для кого
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(30), // Срок жизни токена (пример: 30 минут)
                signingCredentials: creds
            );

            // Превращаем объект JWT в строку (Base64 и т. д.)
            return new JwtSecurityTokenHandler().WriteToken(accessToken);
        }
    }
}
