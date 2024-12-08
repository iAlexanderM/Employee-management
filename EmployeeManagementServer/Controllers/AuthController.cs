using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;

namespace EmployeeManagementServer.Controllers
{
    [AllowAnonymous]
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly JwtTokenService _jwtTokenService;
        private readonly RefreshTokenService _refreshTokenService;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            JwtTokenService jwtTokenService,
            RefreshTokenService refreshTokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenService = jwtTokenService;
            _refreshTokenService = refreshTokenService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByNameAsync(model.Username);
            if (user == null || string.IsNullOrEmpty(model.Username))
            {
                return Unauthorized(new { message = "Пользователь не найден." });
            }

            var result = await _signInManager.PasswordSignInAsync(user.UserName ?? string.Empty, model.Password, false, lockoutOnFailure: false);

            if (result.Succeeded)
            {
                var accessToken = _jwtTokenService.GenerateAccessToken(user);
                var refreshToken = Guid.NewGuid().ToString();

                var refreshTokenEntity = new RefreshToken
                {
                    Token = refreshToken,
                    UserId = user.Id,
                    Expires = DateTime.UtcNow.AddHours(8),
                    IsRevoked = false
                };

                await _refreshTokenService.SaveRefreshTokenAsync(refreshTokenEntity);

                return Ok(new { accessToken, refreshToken, message = "Успешный вход." });
            }

            return Unauthorized(new { message = "Неправильный логин или пароль." });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto model)
        {
            try
            {
                var storedRefreshToken = await _refreshTokenService.GetRefreshTokenAsync(model.RefreshToken);
                if (storedRefreshToken == null || storedRefreshToken.Expires < DateTime.UtcNow)
                {
                    return Unauthorized(new { message = "Refresh Token недействителен." });
                }

                var user = await _userManager.FindByIdAsync(storedRefreshToken.UserId);
                if (user == null)
                {
                    return Unauthorized(new { message = "Пользователь не найден." });
                }

                var accessToken = _jwtTokenService.GenerateAccessToken(user);
                var newRefreshToken = Guid.NewGuid().ToString();

                await _refreshTokenService.RevokeRefreshTokenAsync(model.RefreshToken);

                var refreshTokenEntity = new RefreshToken
                {
                    Token = newRefreshToken,
                    UserId = user.Id,
                    Expires = DateTime.UtcNow.AddHours(8),
                    IsRevoked = false
                };

                await _refreshTokenService.SaveRefreshTokenAsync(refreshTokenEntity);

                return Ok(new { accessToken, refreshToken = newRefreshToken });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ошибка сервера.", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirst("userId")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await _refreshTokenService.RevokeAllTokensForUserAsync(userId);
            }
            await _signInManager.SignOutAsync();
            return Ok(new { message = "Вы успешно вышли из системы." });
        }
    }
}
