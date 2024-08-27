using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NLog.Web;
using AutoMapper;
using MediatR;
using FluentValidation.AspNetCore;
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Настройка строки подключения к базе данных
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Настройка ASP.NET Core Identity
builder.Services.AddDefaultIdentity<ApplicationUser>(options => options.SignIn.RequireConfirmedAccount = true)
    .AddEntityFrameworkStores<ApplicationDbContext>();

// Настройка AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Настройка MediatR
builder.Services.AddMediatR(typeof(Program));

// Настройка FluentValidation
builder.Services.AddControllers()
    .AddFluentValidation(fv => fv.RegisterValidatorsFromAssemblyContaining<Program>());

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

app.UseAuthentication(); // Добавить аутентификацию
app.UseAuthorization(); // Добавить авторизацию

app.MapControllers(); // Маршрутизация контроллеров API

app.Run();
