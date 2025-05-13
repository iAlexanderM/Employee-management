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
using System.Security.Claims;
using Microsoft.OpenApi.Models;
using System.Reflection;
using EmployeeManagementServer.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Logging;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Настройка конфигурации
builder.Configuration.SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

// Подключение к базе данных
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .LogTo(Console.WriteLine, LogLevel.Information));

// Настройка Data Protection
builder.Services.AddDataProtection()
    .PersistKeysToDbContext<ApplicationDbContext>();

// Настройка Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 2;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Регистрация сервисов
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<RefreshTokenService>();
builder.Services.AddHostedService<ExpiredTokenCleanupService>();

// Настройка аутентификации JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["AppSettings:Issuer"],
        ValidAudience = builder.Configuration["AppSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["AppSettings:Token"] ?? string.Empty)),
        NameClaimType = ClaimTypes.NameIdentifier,
        RoleClaimType = ClaimTypes.Role
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"].FirstOrDefault();
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                Console.WriteLine($"[SignalR] Token received from query: {accessToken.Substring(0, Math.Min(50, accessToken.Length))}...");
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"[SignalR] Authentication failed: {context.Exception.Message}");
            return Task.CompletedTask;
        }
    };
});

// Настройка авторизации
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// Настройка CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", builder =>
    {
        builder.WithOrigins("http://localhost:4200")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
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
builder.Services.AddScoped<IPassTransactionSearchService, PassTransactionSearchService>();
builder.Services.AddScoped<IQueueService, QueueService>();
builder.Services.AddScoped<IPassByStoreSearchService, PassByStoreSearchService>();
builder.Services.AddScoped<IPositionSearchService, PositionSearchService>();
builder.Services.AddScoped<IPositionService, PositionService>();
builder.Services.AddScoped<FloorService>();
builder.Services.AddScoped<StoreNumberService>();
builder.Services.AddScoped<BuildingService>();
builder.Services.AddScoped<LineService>();
builder.Services.AddScoped<NationalityService>();
builder.Services.AddScoped<CitizenshipService>();
builder.Services.AddScoped<PositionService>();
builder.Services.AddScoped<SuggestionsService>();
builder.Services.AddScoped<JwtPassTokenService>();
builder.Services.AddScoped<IHistoryService, HistoryService>();

// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// Логирование
builder.Logging.AddConsole();

// Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Employee Management API",
        Version = "v1",
        Description = "API для управления талонами и транзакциями сотрудников."
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Введите только JWT-токен без префикса 'Bearer'.",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    };

    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { securityScheme, Array.Empty<string>() } });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// SignalR
builder.Services.AddSignalR();

// Memory Cache
builder.Services.AddMemoryCache();

// Контроллеры
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Построение приложения
var app = builder.Build();

// Инициализация базы данных и ролей
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    // Миграция базы данных с повторными попытками
    var retryCount = 5;
    var delay = TimeSpan.FromSeconds(5);
    for (int i = 0; i < retryCount; i++)
    {
        try
        {
            Console.WriteLine(">>> Текущая строка подключения: " + dbContext.Database.GetDbConnection().ConnectionString);
            dbContext.Database.Migrate();
            break;
        }
        catch (Exception ex)
        {
            if (i == retryCount - 1)
                throw;

            Console.WriteLine($"Не удалось подключиться к БД. Попытка {i + 1}/{retryCount}. Ожидание {delay.TotalSeconds}с.");
            Console.WriteLine($"Ошибка: {ex.Message}");
            Thread.Sleep(delay);
        }
    }

    // Создание ролей
    string[] roleNames = { "Admin", "Cashier", "Manager" };
    foreach (var roleName in roleNames)
    {
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }

    var adminUser = await userManager.FindByNameAsync("Admin");
    if (adminUser == null)
    {
        adminUser = new ApplicationUser { UserName = "Admin", Email = "admin@example.com", EmailConfirmed = true };
        var result = await userManager.CreateAsync(adminUser, "Admin@12345");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
            Console.WriteLine("Администратор успешно создан.");
        }
        else
        {
            foreach (var error in result.Errors)
            {
                Console.WriteLine($"- {error.Description}");
            }
        }
    }

    var cashierUser = await userManager.FindByNameAsync("Cashier1");
    if (cashierUser == null)
    {
        cashierUser = new ApplicationUser { UserName = "Cashier", Email = "cashier1@example.com" };
        await userManager.CreateAsync(cashierUser, "Cashier@12345");
        await userManager.AddToRoleAsync(cashierUser, "Cashier");
    }

    var managerUser = await userManager.FindByNameAsync("Manager");
    if (managerUser == null)
    {
        managerUser = new ApplicationUser { UserName = "Manager1", Email = "manager1@example.com" };
        await userManager.CreateAsync(managerUser, "Manager@12345");
        await userManager.AddToRoleAsync(managerUser, "Manager");
    }
}

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Employee Management API V1");
    c.RoutePrefix = string.Empty;
});

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseWebSockets();
app.UseRouting();
app.UseCors("AllowAllOrigins");
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<QueueHub>("/hubs/queue");
app.MapControllers();

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Urls.Add($"http://*:{port}");

app.Run();