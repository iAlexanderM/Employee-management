using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly JwtTokenService _jwtTokenService;

        public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, JwtTokenService jwtTokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenService = jwtTokenService;
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
                var token = _jwtTokenService.GenerateToken(user);
                return Ok(new { token, message = "Успешный вход." });
            }

            if (result.IsLockedOut)
            {
                return BadRequest(new { message = "Аккаунт заблокирован." });
            }

            return Unauthorized(new { message = "Неправильный логин или пароль." });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok(new { message = "Вы успешно вышли из системы." });
        }
    }
}
