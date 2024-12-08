using Microsoft.Extensions.Hosting;
using System;
using System.Threading;
using System.Threading.Tasks;
using EmployeeManagementServer.Services;

public class ExpiredTokenCleanupService : IHostedService, IDisposable
{
    private readonly IServiceProvider _serviceProvider;
    private Timer? _timer;

    public ExpiredTokenCleanupService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        // Устанавливаем таймер для очистки устаревших токенов
        _timer = new Timer(async _ =>
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var refreshTokenService = scope.ServiceProvider.GetRequiredService<RefreshTokenService>();
                await refreshTokenService.CleanupExpiredTokensAsync(); // Вызов метода очистки
            }
        }, null, TimeSpan.Zero, TimeSpan.FromHours(24)); // Интервал: каждые 24 часа

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        // Останавливаем таймер при завершении приложения
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _timer?.Dispose();
    }
}
