using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.Extensions.Logging;
using System.Linq;
using System;
using EmployeeManagementServer.Models.DTOs;
using AutoMapper;
using System.Text.Json;

namespace EmployeeManagementServer.Services
{
    public class StoreService : IStoreService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHistoryService _historyService;
        private readonly IMapper _mapper;
        private readonly ILogger<StoreService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public StoreService(ApplicationDbContext context, IHistoryService historyService, IMapper mapper, ILogger<StoreService> logger)
        {
            _context = context;
            _historyService = historyService;
            _mapper = mapper;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetTotalStoresCountAsync(string? building, string? floor, string? line, string? storeNumber, bool? isArchived = null)
        {
            var query = _context.Stores.AsQueryable();

            if (!string.IsNullOrEmpty(building))
                query = query.Where(s => s.Building.Trim() == building!.Trim());
            if (!string.IsNullOrEmpty(floor))
                query = query.Where(s => s.Floor.Trim() == floor!.Trim());
            if (!string.IsNullOrEmpty(line))
                query = query.Where(s => s.Line.Trim() == line!.Trim());
            if (!string.IsNullOrEmpty(storeNumber))
                query = query.Where(s => s.StoreNumber.Trim() == storeNumber!.Trim());

            if (isArchived.HasValue)
            {
                query = query.Where(s => s.IsArchived == isArchived.Value);
            }

            return await query.CountAsync();
        }

        public async Task<List<Store>> GetAllStoresAsync(int skip, int pageSize, string? building, string? floor, string? line, string? storeNumber, bool? isArchived = null)
        {
            var query = _context.Stores.AsQueryable();

            if (!string.IsNullOrEmpty(building))
                query = query.Where(s => s.Building.Trim() == building!.Trim());
            if (!string.IsNullOrEmpty(floor))
                query = query.Where(s => s.Floor.Trim() == floor!.Trim());
            if (!string.IsNullOrEmpty(line))
                query = query.Where(s => s.Line.Trim() == line!.Trim());
            if (!string.IsNullOrEmpty(storeNumber))
                query = query.Where(s => s.StoreNumber.Trim() == storeNumber!.Trim());

            if (isArchived.HasValue)
            {
                query = query.Where(s => s.IsArchived == isArchived.Value);
            }

            return await query
                .OrderBy(s => s.SortOrder == null ? 1 : 0)
                .ThenBy(s => s.SortOrder ?? int.MaxValue)
                .ThenBy(s => s.Id)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Store?> GetStoreByIdAsync(int id)
        {
            return await _context.Stores.FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<Store?> AddStoreAsync(Store store, string? createdBy = null)
        {
            _logger.LogInformation("Попытка добавления нового магазина.");
            if (store == null)
            {
                _logger.LogWarning("Получен null объект магазина для добавления.");
                return null;
            }

            if (await _context.Stores.AnyAsync(s =>
                s.Building == store.Building &&
                s.Line == store.Line &&
                s.Floor == store.Floor &&
                s.StoreNumber == store.StoreNumber))
            {
                _logger.LogWarning("Магазин с такой локацией уже существует: {Building}, {Floor}, {Line}, {StoreNumber}", store.Building, store.Floor, store.Line, store.StoreNumber);
                return null;
            }

            if (store.SortOrder != 0 && store.SortOrder.HasValue && await _context.Stores.AnyAsync(s => s.SortOrder == store.SortOrder))
            {
                _logger.LogWarning("Магазин с таким SortOrder ({SortOrder}) уже существует.", store.SortOrder);
                throw new InvalidOperationException($"Магазин с таким значением SortOrder ({store.SortOrder}) уже существует.");
            }

            if (store.Note != null && store.Note.Length > 500)
            {
                _logger.LogWarning("Заметка для нового магазина превышает 500 символов.");
                throw new ArgumentException("Заметка не должна превышать 500 символов.");
            }

            _context.Stores.Add(store);
            await SaveChangesAsync();

            if (store.SortOrder == 0 || !store.SortOrder.HasValue)
            {
                store.SortOrder = store.Id;
                _context.Stores.Update(store);
                await SaveChangesAsync();
            }

            await _historyService.LogHistoryAsync(new History
            {
                EntityType = "store",
                EntityId = store.Id.ToString(),
                Action = "create",
                Details = $"Магазин {store.Id} успешно создан.",
                ChangesJson = "{}", // Пустой JSON, как в ContractorService
                ChangedBy = createdBy ?? "Unknown",
                ChangedAt = DateTime.UtcNow
            });

            _logger.LogInformation("Магазин с ID {StoreId} успешно создан пользователем {CreatedBy} и запись истории сохранена.", store.Id, createdBy ?? "Unknown");
            return store;
        }

        public async Task<bool?> UpdateStoreAsync(int id, string? newBuilding, string? newFloor, string? newLine, string? newStoreNumber, int? sortOrder, string? note, string? updatedBy = null)
        {
            _logger.LogInformation("Попытка обновления магазина с ID {Id}", id);
            var store = await _context.Stores.FindAsync(id);
            if (store == null)
            {
                _logger.LogWarning("Магазин с ID {Id} не найден.", id);
                return null;
            }

            var originalStore = await _context.Stores
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);

            if (originalStore == null)
            {
                _logger.LogWarning("Оригинальный магазин с ID {Id} не найден.", id);
                return null;
            }

            if (!string.IsNullOrEmpty(newBuilding) && !string.IsNullOrEmpty(newFloor) &&
                !string.IsNullOrEmpty(newLine) && !string.IsNullOrEmpty(newStoreNumber) &&
                (originalStore.Building != newBuilding || originalStore.Floor != newFloor ||
                 originalStore.Line != newLine || originalStore.StoreNumber != newStoreNumber))
            {
                if (await _context.Stores.AnyAsync(s =>
                    s.Id != id &&
                    s.Building == newBuilding &&
                    s.Line == newLine &&
                    s.Floor == newFloor &&
                    s.StoreNumber == newStoreNumber))
                {
                    _logger.LogWarning("Магазин с такой локацией ({Building}, {Floor}, {Line}, {StoreNumber}) уже существует при попытке обновления магазина {Id}.", newBuilding, newFloor, newLine, newStoreNumber, id);
                    throw new InvalidOperationException("Точка с такими данными уже существует.");
                }
            }

            if (sortOrder.HasValue && originalStore.SortOrder != sortOrder.Value)
            {
                if (await _context.Stores.AnyAsync(s => s.SortOrder == sortOrder.Value && s.Id != id))
                {
                    _logger.LogWarning("Магазин с таким SortOrder ({SortOrder}) уже существует при попытке обновления магазина {Id}.", sortOrder.Value, id);
                    throw new InvalidOperationException("Точка с таким значением сортировки уже существует.");
                }
            }

            if (note != null && note.Length > 500)
            {
                _logger.LogWarning("Заметка для магазина с ID {Id} превышает 500 символов.", id);
                throw new ArgumentException("Заметка не должна превышать 500 символов.");
            }

            var updatedStoreDto = new StoreDto
            {
                Id = store.Id,
                Building = newBuilding ?? store.Building,
                Floor = newFloor ?? store.Floor,
                Line = newLine ?? store.Line,
                StoreNumber = newStoreNumber ?? store.StoreNumber,
                SortOrder = sortOrder ?? store.SortOrder,
                Note = note ?? store.Note,
                IsArchived = store.IsArchived,
                CreatedAt = store.CreatedAt
            };

            var originalStoreDto = _mapper.Map<StoreDto>(originalStore);
            var changes = CompareStoreDtos(originalStoreDto, updatedStoreDto);

            _mapper.Map(updatedStoreDto, store);
            await SaveChangesAsync();

            if (changes.Any())
            {
                var historyEntry = new History
                {
                    EntityType = "store",
                    EntityId = store.Id.ToString(),
                    Action = "update",
                    Details = $"Обновлены данные магазина с ID {store.Id}.",
                    ChangesJson = JsonSerializer.Serialize(changes, _jsonOptions),
                    ChangedBy = updatedBy ?? "Unknown",
                    ChangedAt = DateTime.UtcNow
                };
                _logger.LogInformation("Создание записи истории: ChangesJson={ChangesJson}", historyEntry.ChangesJson);
                await _historyService.LogHistoryAsync(historyEntry);
                _logger.LogInformation("Изменения для магазина ID {Id} успешно записаны в историю.", store.Id);
            }
            else
            {
                _logger.LogInformation("Изменений для магазина ID {Id} не обнаружено, история не записана.", store.Id);
            }

            _logger.LogInformation("Магазин с ID {Id} успешно обновлен пользователем {UpdatedBy}.", id, updatedBy ?? "Unknown");
            return true;
        }

        public async Task ArchiveStoreAsync(int id, string? archivedBy = null)
        {
            _logger.LogInformation("Попытка архивировать магазин с ID {Id} пользователем {ArchivedBy}", id, archivedBy ?? "Unknown");
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.Id == id);

            if (store == null)
            {
                _logger.LogWarning("Магазин с ID {Id} не найден для архивирования.", id);
                throw new KeyNotFoundException($"Магазин с ID {id} не найден.");
            }
            if (store.IsArchived)
            {
                _logger.LogInformation("Магазин с ID {Id} уже архивирован.", id);
                throw new InvalidOperationException($"Магазин с ID {id} уже архивирован.");
            }

            store.IsArchived = true;
            await SaveChangesAsync();

            var changes = new Dictionary<string, ChangeValueDto>
            {
                { "isArchived", new ChangeValueDto { OldValue = false, NewValue = true } }
            };

            var historyEntry = new History
            {
                EntityType = "store",
                EntityId = store.Id.ToString(),
                Action = "archive",
                Details = $"Магазин с ID {id} архивирован.",
                ChangesJson = JsonSerializer.Serialize(changes, _jsonOptions),
                ChangedBy = archivedBy ?? "Unknown",
                ChangedAt = DateTime.UtcNow
            };
            _logger.LogInformation("Создание записи истории: ChangesJson={ChangesJson}", historyEntry.ChangesJson);
            await _historyService.LogHistoryAsync(historyEntry);
            _logger.LogInformation("Запись истории 'archive' с деталями изменения IsArchived добавлена для магазина ID {Id}.", id);

            _logger.LogInformation("Магазин с ID {Id} успешно архивирован пользователем {ArchivedBy}, изменения и история сохранены.", id, archivedBy ?? "Unknown");
        }

        public async Task UnarchiveStoreAsync(int id, string? unarchivedBy = null)
        {
            _logger.LogInformation("Попытка разархивировать магазин с ID {Id} пользователем {UnarchivedBy}", id, unarchivedBy ?? "Unknown");
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.Id == id);

            if (store == null)
            {
                _logger.LogWarning("Магазин с ID {Id} не найден для разархивирования.", id);
                throw new KeyNotFoundException($"Магазин с ID {id} не найден.");
            }
            if (!store.IsArchived)
            {
                _logger.LogInformation("Магазин с ID {Id} уже не архивирован.", id);
                throw new InvalidOperationException($"Магазин с ID {id} уже разархивирован.");
            }

            store.IsArchived = false;
            await SaveChangesAsync();

            var changes = new Dictionary<string, ChangeValueDto>
            {
                { "isArchived", new ChangeValueDto { OldValue = true, NewValue = false } }
            };

            var historyEntry = new History
            {
                EntityType = "store",
                EntityId = store.Id.ToString(),
                Action = "unarchive",
                Details = $"Магазин с ID {id} разархивирован.",
                ChangesJson = JsonSerializer.Serialize(changes, _jsonOptions),
                ChangedBy = unarchivedBy ?? "Unknown",
                ChangedAt = DateTime.UtcNow
            };
            _logger.LogInformation("Создание записи истории: ChangesJson={ChangesJson}", historyEntry.ChangesJson);
            await _historyService.LogHistoryAsync(historyEntry);
            _logger.LogInformation("Запись истории 'unarchive' с деталями изменения IsArchived добавлена для магазина ID {Id}.", id);

            _logger.LogInformation("Магазин с ID {Id} успешно разархивирован пользователем {UnarchivedBy}, изменения и история сохранены.", id, unarchivedBy ?? "Unknown");
        }

        public async Task UpdateStoreNoteAsync(int id, string? note, string? updatedBy = null)
        {
            _logger.LogInformation("Попытка обновления заметки для магазина с ID {Id}", id);
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.Id == id);
            if (store == null)
            {
                _logger.LogWarning("Магазин с ID {Id} не найден.", id);
                throw new KeyNotFoundException($"Магазин с ID {id} не найден.");
            }

            if (note != null && note.Length > 500)
            {
                _logger.LogWarning("Заметка для магазина с ID {Id} превышает 500 символов.", id);
                throw new ArgumentException("Заметка не должна превышать 500 символов.");
            }

            if (store.Note == note)
            {
                _logger.LogInformation("Заметка для магазина с ID {Id} не изменилась, история не записана.", id);
                return;
            }

            var oldNote = store.Note;
            store.Note = note;
            await SaveChangesAsync();

            var changes = new Dictionary<string, ChangeValueDto>
            {
                { "note", new ChangeValueDto { OldValue = oldNote ?? "не указано", NewValue = note ?? "не указано" } }
            };

            var historyEntry = new History
            {
                EntityType = "store",
                EntityId = id.ToString(),
                Action = "update_note",
                Details = $"Заметка для магазина с ID {id} обновлена.",
                ChangesJson = JsonSerializer.Serialize(changes, _jsonOptions),
                ChangedBy = updatedBy ?? "Unknown",
                ChangedAt = DateTime.UtcNow
            };
            _logger.LogInformation("Создание записи истории: ChangesJson={ChangesJson}", historyEntry.ChangesJson);
            await _historyService.LogHistoryAsync(historyEntry);
            _logger.LogInformation("Заметка для магазина с ID {Id} успешно обновлена, история изменений записана.", id);
        }

        private Dictionary<string, ChangeValueDto> CompareStoreDtos(StoreDto original, StoreDto updated)
        {
            var changes = new Dictionary<string, ChangeValueDto>();

            if (original.Building != updated.Building)
            {
                changes.Add("building", new ChangeValueDto { OldValue = original.Building, NewValue = updated.Building });
                _logger.LogInformation("Изменение building: oldValue={OldValue}, newValue={NewValue}", original.Building, updated.Building);
            }

            if (original.Floor != updated.Floor)
            {
                changes.Add("floor", new ChangeValueDto { OldValue = original.Floor, NewValue = updated.Floor });
                _logger.LogInformation("Изменение floor: oldValue={OldValue}, newValue={NewValue}", original.Floor, updated.Floor);
            }

            if (original.Line != updated.Line)
            {
                changes.Add("line", new ChangeValueDto { OldValue = original.Line, NewValue = updated.Line });
                _logger.LogInformation("Изменение line: oldValue={OldValue}, newValue={NewValue}", original.Line, updated.Line);
            }

            if (original.StoreNumber != updated.StoreNumber)
            {
                changes.Add("storeNumber", new ChangeValueDto { OldValue = original.StoreNumber, NewValue = updated.StoreNumber });
                _logger.LogInformation("Изменение storeNumber: oldValue={OldValue}, newValue={NewValue}", original.StoreNumber, updated.StoreNumber);
            }

            if (original.SortOrder != updated.SortOrder)
            {
                changes.Add("sortOrder", new ChangeValueDto { OldValue = original.SortOrder?.ToString() ?? "null", NewValue = updated.SortOrder?.ToString() ?? "null" });
                _logger.LogInformation("Изменение sortOrder: oldValue={OldValue}, newValue={NewValue}", original.SortOrder?.ToString() ?? "null", updated.SortOrder?.ToString() ?? "null");
            }

            if (original.Note != updated.Note)
            {
                changes.Add("note", new ChangeValueDto { OldValue = original.Note ?? "не указано", NewValue = updated.Note ?? "не указано" });
                _logger.LogInformation("Изменение note: oldValue={OldValue}, newValue={NewValue}", original.Note ?? "не указано", updated.Note ?? "не указано");
            }

            return changes;
        }
    }
}