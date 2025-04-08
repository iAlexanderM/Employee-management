using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace EmployeeManagementServer.Services
{
    public class JwtPassTokenService
    {
        private readonly string _secret;

        public JwtPassTokenService(IConfiguration configuration)
        {
            _secret = configuration["AppSettings:PassTokenSecret"] ?? "DefaultSecretChangeMe";
        }

        public string GeneratePassToken(string tokenType, long talonNum, string? userId, TimeSpan? lifetime = null)
        {
            var validFor = lifetime ?? TimeSpan.FromMinutes(30);

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var creds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var now = DateTime.UtcNow;

            var claims = new List<Claim>
            {
                new Claim("talonType", tokenType),
                new Claim("talonNum", talonNum.ToString())
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

                ValidateLifetime = true, 
                ClockSkew = TimeSpan.Zero 
            };

            try
            {
                var handler = new JwtSecurityTokenHandler();
                var principal = handler.ValidateToken(tokenString, validationParams, out var validatedToken);

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
