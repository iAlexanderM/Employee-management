using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EmployeeManagementServer.Services
{
    public class HistoryService : IHistoryService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HistoryService> _logger;

        public HistoryService(ApplicationDbContext context, ILogger<HistoryService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<History>> GetHistoryAsync(string entityType, string entityId)
        {
            return await _context.History
                .Where(h => h.EntityType == entityType && h.EntityId == entityId)
                .OrderByDescending(h => h.ChangedAt)
                .ToListAsync();
        }

        public async Task LogHistoryAsync(History historyEntry)
        {
            if (historyEntry == null)
            {
                _logger.LogWarning("Получена null запись истории.");
                throw new ArgumentNullException(nameof(historyEntry));
            }

            // Логируем входные данные
            _logger.LogInformation("Логирование истории: EntityType={EntityType}, EntityId={EntityId}, Action={Action}, ChangesJson={ChangesJson}",
                historyEntry.EntityType, historyEntry.EntityId, historyEntry.Action, historyEntry.ChangesJson);

            // Проверяем ChangesJson
            if (!string.IsNullOrWhiteSpace(historyEntry.ChangesJson))
            {
                try
                {
                    JsonSerializer.Deserialize<object>(historyEntry.ChangesJson);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning("Некорректный JSON в ChangesJson: {Error}. Устанавливаем '{}'.", ex.Message);
                    historyEntry.ChangesJson = "{}";
                }
            }
            else
            {
                historyEntry.ChangesJson = "{}";
            }

            _context.History.Add(historyEntry);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Запись истории сохранена: EntityType={EntityType}, EntityId={EntityId}, Action={Action}",
                historyEntry.EntityType, historyEntry.EntityId, historyEntry.Action);
        }
    }
}