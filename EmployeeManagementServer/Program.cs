using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NLog.Web;
using AutoMapper;
using MediatR;  // Это правильное пространство имен
using FluentValidation.AspNetCore;
using Microsoft.OpenApi.Models;
using Npgsql.EntityFrameworkCore.PostgreSQL;

var builder = WebApplication.CreateBuilder(args);

// Настройка строки подключения к базе данных PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Настройка ASP.NET Core Identity
builder.Services.AddDefaultIdentity<ApplicationUser>(options => options.SignIn.RequireConfirmedAccount = true)
    .AddEntityFrameworkStores<ApplicationDbContext>();

// Настройка AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Настройка MediatR - исправлено
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Program>());

// Настройка FluentValidation
builder.Services.AddControllers()
    .AddFluentValidation(fv => fv.RegisterValidatorsFromAssemblyContaining<Program>());

// Настройка CORS (разрешение взаимодействия с Angular)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
        builder => builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// Настройка Swagger для документации API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Employee Management API", Version = "v1" });
});

// Настройка NLog для логирования
builder.Logging.ClearProviders();
builder.Host.UseNLog();

var app = builder.Build();

// Middleware настройки

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage(); // Страница разработки для ошибок
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Employee Management API v1"));
}

app.UseHttpsRedirection();

app.UseCors("AllowAllOrigins"); // Включение CORS для поддержки запросов от клиента Angular

app.UseAuthentication(); // Включение аутентификации
app.UseAuthorization(); // Включение авторизации

app.MapControllers(); // Маршрутизация для контроллеров API

app.Run();
