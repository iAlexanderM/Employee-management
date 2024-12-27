using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace EmployeeManagementServer.Services
{
    /// <summary>
    /// Сервис для генерации и проверки "талонных" JWT. 
    /// </summary>
    public class JwtPassTokenService
    {
        private readonly string _secret; // Берём секретный ключ из конфигурации

        public JwtPassTokenService(IConfiguration configuration)
        {
            // Считаем из appsettings: "AppSettings:PassTokenSecret"
            _secret = configuration["AppSettings:PassTokenSecret"] ?? "DefaultSecretChangeMe";
        }

        /// <summary>
        /// Генерировать подписанный токен с номером talonNum (например, 3), типом "P" и userId (если нужно).
        /// </summary>
        public string GeneratePassToken(string tokenType, long talonNum, string? userId, TimeSpan? lifetime = null)
        {
            // Указываем время жизни (по умолчанию 30 минут)
            var validFor = lifetime ?? TimeSpan.FromMinutes(30);

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var creds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var now = DateTime.UtcNow;

            // Claims - всё, что хотим "зашить" в токен.
            var claims = new List<Claim>
            {
                new Claim("talonType", tokenType),
                new Claim("talonNum", talonNum.ToString())
                // Если нужно проверить "кто" взял талон:
            };
            if (!string.IsNullOrEmpty(userId))
            {
                claims.Add(new Claim("userId", userId));
            }

            var jwt = new JwtSecurityToken(
                claims: claims,
                notBefore: now,
                expires: now.Add(validFor),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(jwt);
        }

        /// <summary>
        /// Проверить подписанный токен, вернуть (isValid, talonType, talonNum, userId) при успехе
        /// или (false, ...) при ошибке.
        /// </summary>
        public (bool isValid, string error, string? talonType, long? talonNum, string? userId)
            ValidatePassToken(string tokenString)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var validationParams = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = securityKey,

                ValidateIssuer = false,
                ValidateAudience = false,

                ValidateLifetime = true, // проверяем срок действия
                ClockSkew = TimeSpan.Zero // без дополнительной "погрешности"
            };

            try
            {
                var handler = new JwtSecurityTokenHandler();
                var principal = handler.ValidateToken(tokenString, validationParams, out var validatedToken);

                // Извлекаем нужные клеймы
                var typeClaim = principal.FindFirst("talonType")?.Value;
                var numClaim = principal.FindFirst("talonNum")?.Value;
                var userClaim = principal.FindFirst("userId")?.Value;

                if (string.IsNullOrWhiteSpace(typeClaim)
                    || string.IsNullOrWhiteSpace(numClaim))
                {
                    return (false, "Missing claims", null, null, null);
                }

                if (!long.TryParse(numClaim, out long parsedNum))
                {
                    return (false, "Cannot parse talonNum", null, null, null);
                }

                // Всё ок
                return (true, "", typeClaim, parsedNum, userClaim);
            }
            catch (SecurityTokenException ex)
            {
                return (false, $"Security token error: {ex.Message}", null, null, null);
            }
            catch (Exception ex)
            {
                return (false, $"General error: {ex.Message}", null, null, null);
            }
        }
    }
}
