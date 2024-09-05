using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;

class Program
{
	static async Task Main(string[] args)
	{
		// Создание конфигурации из appsettings.json
		var configuration = new ConfigurationBuilder()
			.SetBasePath(Directory.GetCurrentDirectory())
			.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
			.Build();

		// Создание и настройка WebApplicationBuilder
		var builder = WebApplication.CreateBuilder(args);

		// Настройка сервисов ASP.NET Core
		builder.Services.AddLogging(config =>
		{
			config.AddConsole();
			config.AddDebug();
		});

		builder.Services.AddDbContext<ApplicationDbContext>(options =>
			options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))); // Используем строку подключения из конфигурации

		builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
			.AddEntityFrameworkStores<ApplicationDbContext>()
			.AddDefaultTokenProviders();

		// Создание WebApplication
		var app = builder.Build();

		// Создание области действия для выполнения миграций и создания пользователя
		using (var scope = app.Services.CreateScope())
		{
			var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
			dbContext.Database.Migrate();

			// Получаем сервис UserManager из контейнера сервисов
			var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

			string userName = "User1";
			string password = "User1@user123";

			if (await userManager.FindByNameAsync(userName) == null)
			{
				var user = new ApplicationUser
				{
					UserName = userName,
					Email = "user1@example.com"
				};

				var result = await userManager.CreateAsync(user, password);

				if (result.Succeeded)
				{
					Console.WriteLine("User created successfully!");

					// Дополнительная проверка: убедимся, что пароль хэшируется
					var createdUser = await userManager.FindByNameAsync(userName);
					if (createdUser != null)
					{
						Console.WriteLine($"PasswordHash for {createdUser.UserName}: {createdUser.PasswordHash}");
					}
				}
				else
				{
					Console.WriteLine("Error creating user:");
					foreach (var error in result.Errors)
					{
						Console.WriteLine($"- {error.Description}");
					}
				}
			}
			else
			{
				Console.WriteLine("User already exists.");
			}
		}

		app.Run();
	}
}
