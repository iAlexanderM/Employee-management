using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using EmployeeManagementServer.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using System.IO;
using EmployeeManagementServer.Services;
using AutoMapper;

var builder = WebApplication.CreateBuilder(args);

// Чтение конфигурации
builder.Configuration.SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

// Настройка базы данных
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Настройка Data Protection для Identity (хранение ключей шифрования)
builder.Services.AddDataProtection()
    .PersistKeysToDbContext<ApplicationDbContext>();

// Настройка Identity для работы с пользователями
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Настройка аутентификации через JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "JwtBearer";
    options.DefaultChallengeScheme = "JwtBearer";
})
.AddJwtBearer("JwtBearer", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["AppSettings:Issuer"],
        ValidAudience = builder.Configuration["AppSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["AppSettings:Token"]))
    };
});

// Настройка Cors для разрешения запросов из любого источника
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

builder.Services.AddScoped<IContractorService, ContractorService>();

builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// Добавляем контроллеры
builder.Services.AddControllers();

var app = builder.Build();

// Обрабатываем миграции базы данных при старте приложения
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    var retryCount = 5;
    var delay = TimeSpan.FromSeconds(5);
    for (int i = 0; i < retryCount; i++)
    {
        try
        {
            dbContext.Database.Migrate();
            break;
        }
        catch (Exception ex)
        {
            if (i == retryCount - 1)
                throw; // После всех попыток бросаем исключение
            Console.WriteLine($"Не удалось подключиться к базе данных. Попытка {i + 1} из {retryCount}. Ожидание {delay.TotalSeconds} секунд.");
            Thread.Sleep(delay);
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// Подключаем CORS для API
app.UseCors("AllowAllOrigins");

// Подключаем аутентификацию и авторизацию
app.UseAuthentication();
app.UseAuthorization();

// Маршрутизация контроллеров
app.MapControllers();

// Чтение порта для запуска приложения
var port = Environment.GetEnvironmentVariable("PORT") ?? "80";
app.Urls.Add($"http://*:{port}");

app.Run();
