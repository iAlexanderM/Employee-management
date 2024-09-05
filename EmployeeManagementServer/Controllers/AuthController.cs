using EmployeeManagementServer.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class AuthController : ControllerBase
	{
		private readonly UserManager<ApplicationUser> _userManager;
		private readonly SignInManager<ApplicationUser> _signInManager;
		private readonly IConfiguration _configuration;

		public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration)
		{
			_userManager = userManager;
			_configuration = configuration;
		}

		[HttpPost("login")]
		public async Task<IActionResult> Login([FromBody] UserLoginDto request)
		{
			if (request == null || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
				return BadRequest("Invalid login request.");

			var user = await _userManager.FindByNameAsync(request.Username);

			if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
				return Unauthorized("Invalid credentials.");

			var token = GenerateJwtToken(user);

			return Ok(new { token });
		}

		[HttpPost("logout")]
		[Authorize]
		public async Task<IActionResult> Logout()
		{
			await _signInManager.SignOutAsync();
			return Ok(new { message = "Вы успешно вышли из системы." });
		}

		private string GenerateJwtToken(ApplicationUser user)
		{
			var claims = new[]
			{
				new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
				new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
			};

			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["AppSettings:Token"]));
			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var token = new JwtSecurityToken(
				issuer: _configuration["AppSettings:Issuer"],
				audience: _configuration["AppSettings:Audience"],
				claims: claims,
				expires: DateTime.UtcNow.AddMinutes(30),
				signingCredentials: creds
			);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}
	}
}
