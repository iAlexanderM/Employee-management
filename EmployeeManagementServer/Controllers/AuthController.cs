using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Data;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly JwtTokenService _jwtTokenService;
        private readonly RefreshTokenService _refreshTokenService;
        private readonly IQueueService _queueService;
        private readonly ApplicationDbContext _context;
        private readonly RoleManager<IdentityRole> _roleManager;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            JwtTokenService jwtTokenService,
            RoleManager<IdentityRole> roleManager,
            RefreshTokenService refreshTokenService,
            IQueueService queueService,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenService = jwtTokenService;
            _refreshTokenService = refreshTokenService;
            _queueService = queueService;
            _roleManager = roleManager;
            _context = context;
        }

        [HttpPost("login")]
        [AllowAnonymous]
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
                var accessToken = await _jwtTokenService.GenerateAccessToken(user); // Добавлен await
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
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto model)
        {
            try
            {
                var storedRefreshToken = await _refreshTokenService.GetRefreshTokenAsync(model.RefreshToken);
                if (storedRefreshToken == null || storedRefreshToken.Expires < DateTime.UtcNow || storedRefreshToken.IsRevoked)
                {
                    return Unauthorized(new { message = "Refresh Token недействителен." });
                }

                var user = await _userManager.FindByIdAsync(storedRefreshToken.UserId);
                if (user == null)
                {
                    return Unauthorized(new { message = "Пользователь не найден." });
                }

                var accessToken = await _jwtTokenService.GenerateAccessToken(user);
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
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Не удалось определить пользователя.");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                var activeToken = await _context.QueueTokens
                    .FirstOrDefaultAsync(q => q.UserId == userId && q.Status == "Active");

                if (activeToken != null)
                {
                    Console.WriteLine($"Найден активный талон: {activeToken.Token}");
                    var success = await _queueService.CloseActiveTokenAsync(userId, activeToken.Token);

                    if (!success)
                    {
                        Console.WriteLine("Не удалось закрыть активный талон.");
                        return BadRequest("Не удалось закрыть активный талон.");
                    }
                    else
                    {
                        Console.WriteLine("Активный талон успешно закрыт.");
                    }
                }
                else
                {
                    Console.WriteLine("Активный талон не найден.");
                }
            }
            else
            {
                Console.WriteLine("Пользователь не найден.");
            }

            await _refreshTokenService.RevokeAllTokensForUserAsync(userId);
            await _signInManager.SignOutAsync();

            return Ok(new { message = "Вы успешно вышли из системы." });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto dto)
        {
            // Проверяем, существует ли пользователь с таким логином
            var existingUser = await _userManager.FindByNameAsync(dto.Username);
            if (existingUser != null)
            {
                return BadRequest(new { message = $"Пользователь с логином '{dto.Username}' уже существует." });
            }

            var user = new ApplicationUser
            {
                UserName = dto.Username,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors); 
            }

            await _userManager.AddToRoleAsync(user, dto.Role);

            return Ok(new { message = "User registered successfully", userId = user.Id });
        }
    }
}