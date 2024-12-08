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
using Microsoft.AspNetCore.Authorization;

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

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Регистрация сервисов для работы с токенами
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<RefreshTokenService>();

// Регистрация фоновой задачи для очистки токенов
builder.Services.AddHostedService<ExpiredTokenCleanupService>();

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
        ValidateIssuer = true, // Проверка издателя токена
        ValidateAudience = true, // Проверка аудитории токена
        ValidateLifetime = true, // Проверка срока действия токена
        ValidateIssuerSigningKey = true, // Проверка подписи токена
        ValidIssuer = builder.Configuration["AppSettings:Issuer"], // Настройки издателя
        ValidAudience = builder.Configuration["AppSettings:Audience"], // Настройки аудитории
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["AppSettings:Token"] ?? string.Empty)) // Секретный ключ
    };
});

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
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

// Регистрация остальных сервисов
builder.Services.AddScoped<ContractorService>();
builder.Services.AddScoped<IContractorSearchService, ContractorSearchService>();
builder.Services.AddScoped<IStoreService, StoreService>();
builder.Services.AddScoped<IStoreSearchService, StoreSearchService>();
builder.Services.AddScoped<IBuildingService, BuildingService>();
builder.Services.AddScoped<IBuildingSearchService, BuildingSearchService>();
builder.Services.AddScoped<IFloorService, FloorService>();
builder.Services.AddScoped<IFloorSearchService, FloorSearchService>();
builder.Services.AddScoped<ILineService, LineService>();
builder.Services.AddScoped<ILineSearchService, LineSearchService>();
builder.Services.AddScoped<IStoreNumberService, StoreNumberService>();
builder.Services.AddScoped<IStoreNumberSearchService, StoreNumberSearchService>();
builder.Services.AddScoped<INationalityService, NationalityService>();
builder.Services.AddScoped<INationalitySearchService, NationalitySearchService>();
builder.Services.AddScoped<ICitizenshipService, CitizenshipService>();
builder.Services.AddScoped<ICitizenshipSearchService, CitizenshipSearchService>();
builder.Services.AddScoped<ISuggestionsService, SuggestionsService>();

builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

builder.Logging.AddConsole();

builder.Services.AddScoped<FloorService>();
builder.Services.AddScoped<StoreNumberService>();
builder.Services.AddScoped<BuildingService>();
builder.Services.AddScoped<LineService>();
builder.Services.AddScoped<NationalityService>();
builder.Services.AddScoped<CitizenshipService>();
builder.Services.AddScoped<SuggestionsService>();

// Настройка контроллеров
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

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
        catch
        {
            if (i == retryCount - 1)
                throw;
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
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Urls.Add($"http://*:{port}");

app.Run();
