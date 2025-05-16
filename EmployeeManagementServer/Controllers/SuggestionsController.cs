using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[Authorize]
[ApiController]
[Route("api/suggestions")]
public class SuggestionsController : ControllerBase
{
    private readonly ISuggestionsService _suggestionsService;
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<SuggestionsController> _logger;

    public SuggestionsController(
        ISuggestionsService suggestionsService,
        ApplicationDbContext context,
        IMemoryCache cache,
        ILogger<SuggestionsController> logger)
    {
        _suggestionsService = suggestionsService;
        _context = context;
        _memoryCache = cache;
        _logger = logger;
    }

    [HttpGet("buildings")]
    public IActionResult GetBuildingSuggestions([FromQuery] string? query, [FromQuery] bool? isArchived = null)
    {
        try
        {
            string cacheKey = $"buildings_{query ?? ""}_{isArchived}";
            if (_memoryCache.TryGetValue(cacheKey, out List<string> cachedSuggestions))
            {
                _logger.LogInformation("Кешированные результаты для запроса зданий: query={Query}, isArchived={IsArchived}", query, isArchived);
                return Ok(cachedSuggestions);
            }

            var suggestions = _suggestionsService.GetBuildingSuggestions(query ?? string.Empty, isArchived);
            _memoryCache.Set(cacheKey, suggestions, TimeSpan.FromMinutes(10));
            _logger.LogInformation("Найдено {Count} результатов для запроса зданий: query={Query}, isArchived={IsArchived}", suggestions.Count(), query, isArchived);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении подсказок для зданий: query={Query}, isArchived={IsArchived}", query, isArchived);
            return StatusCode(500, "Произошла ошибка на сервере при обработке запроса.");
        }
    }

    [HttpGet("floors")]
    public IActionResult GetFloorSuggestions([FromQuery] string? query, [FromQuery] bool? isArchived = null)
    {
        try
        {
            string cacheKey = $"floors_{query ?? ""}_{isArchived}";
            if (_memoryCache.TryGetValue(cacheKey, out List<string> cachedSuggestions))
            {
                _logger.LogInformation("Кешированные результаты для запроса этажей: query={Query}, isArchived={IsArchived}", query, isArchived);
                return Ok(cachedSuggestions);
            }

            var suggestions = _suggestionsService.GetFloorSuggestions(query ?? string.Empty, isArchived);
            _memoryCache.Set(cacheKey, suggestions, TimeSpan.FromMinutes(10));
            _logger.LogInformation("Найдено {Count} результатов для запроса этажей: query={Query}, isArchived={IsArchived}", suggestions.Count(), query, isArchived);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении подсказок для этажей: query={Query}, isArchived={IsArchived}", query, isArchived);
            return StatusCode(500, "Произошла ошибка на сервере при обработке запроса.");
        }
    }

    [HttpGet("lines")]
    public IActionResult GetLineSuggestions([FromQuery] string? query, [FromQuery] bool? isArchived = null)
    {
        try
        {
            string cacheKey = $"lines_{query ?? ""}_{isArchived}";
            if (_memoryCache.TryGetValue(cacheKey, out List<string> cachedSuggestions))
            {
                _logger.LogInformation("Кешированные результаты для запроса линий: query={Query}, isArchived={IsArchived}", query, isArchived);
                return Ok(cachedSuggestions);
            }

            var suggestions = _suggestionsService.GetLineSuggestions(query ?? string.Empty, isArchived);
            _memoryCache.Set(cacheKey, suggestions, TimeSpan.FromMinutes(10));
            _logger.LogInformation("Найдено {Count} результатов для запроса линий: query={Query}, isArchived={IsArchived}", suggestions.Count(), query, isArchived);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении подсказок для линий: query={Query}, isArchived={IsArchived}", query, isArchived);
            return StatusCode(500, "Произошла ошибка на сервере при обработке запроса.");
        }
    }

    [HttpGet("storeNumbers")]
    public IActionResult GetStoreNumberSuggestions([FromQuery] string? query, [FromQuery] bool? isArchived = null)
    {
        try
        {
            string cacheKey = $"storeNumbers_{query ?? ""}_{isArchived}";
            if (_memoryCache.TryGetValue(cacheKey, out List<string> cachedSuggestions))
            {
                _logger.LogInformation("Кешированные результаты для запроса номеров точек: query={Query}, isArchived={IsArchived}", query, isArchived);
                return Ok(cachedSuggestions);
            }

            var suggestions = _suggestionsService.GetStoreNumberSuggestions(query ?? string.Empty, isArchived);
            _memoryCache.Set(cacheKey, suggestions, TimeSpan.FromMinutes(10));
            _logger.LogInformation("Найдено {Count} результатов для запроса номеров точек: query={Query}, isArchived={IsArchived}", suggestions.Count(), query, isArchived);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении подсказок для номеров точек: query={Query}, isArchived={IsArchived}", query, isArchived);
            return StatusCode(500, "Произошла ошибка на сервере при обработке запроса.");
        }
    }

    [HttpGet("contractors")]
    public async Task<IActionResult> GetContractorSuggestions([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(new List<ContractorDto>());
        }

        try
        {
            var queryParts = query.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var suggestionsQuery = _context.Contractors.AsQueryable();

            foreach (var part in queryParts)
            {
                suggestionsQuery = suggestionsQuery.Where(c =>
                    EF.Functions.Like(c.LastName, $"%{part}%") ||
                    EF.Functions.Like(c.FirstName, $"%{part}%") ||
                    EF.Functions.Like(c.MiddleName, $"%{part}%"));
            }

            var suggestions = await suggestionsQuery
                .Select(c => new ContractorDto
                {
                    Id = c.Id,
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    MiddleName = c.MiddleName,
                    BirthDate = c.BirthDate,
                    Citizenship = c.Citizenship,
                    Nationality = c.Nationality,
                    DocumentType = c.DocumentType,
                    PassportSerialNumber = c.PassportSerialNumber,
                    PassportIssuedBy = c.PassportIssuedBy,
                    PassportIssueDate = c.PassportIssueDate,
                    PhoneNumber = c.PhoneNumber,
                    ProductType = c.ProductType,
                    IsArchived = c.IsArchived,
                    CreatedAt = c.CreatedAt,
                    SortOrder = c.SortOrder
                })
                .Distinct()
                .OrderBy(dto => dto.LastName).ThenBy(dto => dto.FirstName).ThenBy(dto => dto.MiddleName)
                .Take(10)
                .ToListAsync();

            _logger.LogInformation("Найдено {Count} контрагентов для запроса: {Query}", suggestions.Count, query);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении подсказок для контрагентов: query={Query}", query);
            return StatusCode(500, "Произошла ошибка на сервере при обработке запроса.");
        }
    }

    [HttpGet("stores")]
    public async Task<IActionResult> GetStoreSuggestions([FromQuery] string query, [FromQuery] bool? isArchived = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            {
                _logger.LogWarning("Пустой или слишком короткий запрос на подсказки магазинов: query={Query}", query);
                return Ok(new List<string>());
            }

            string cacheKey = $"stores_{query}_{isArchived}";
            if (_memoryCache.TryGetValue(cacheKey, out List<string> cachedSuggestions))
            {
                _logger.LogInformation("Кешированные результаты для запроса магазинов: query={Query}, isArchived={IsArchived}", query, isArchived);
                return Ok(cachedSuggestions);
            }

            var normalizedQuery = query.Trim().ToLower();
            var queryParts = normalizedQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            string building = null, floor = null, line = null, storeNumber = null;
            if (queryParts.Length > 0) building = queryParts[0];
            if (queryParts.Length > 1) floor = queryParts[1];
            if (queryParts.Length > 2) line = queryParts[2];
            if (queryParts.Length > 3) storeNumber = queryParts[3];

            var suggestionsQuery = _context.Stores
                .Join(_context.Buildings, s => s.Building, b => b.Name, (s, b) => new { s, b })
                .Join(_context.Floors, x => x.s.Floor, f => f.Name, (x, f) => new { x.s, x.b, f })
                .Join(_context.Lines, x => x.s.Line, l => l.Name, (x, l) => new { x.s, x.b, x.f, l })
                .Join(_context.StoreNumbers, x => x.s.StoreNumber, sn => sn.Name, (x, sn) => new { x.s, x.b, x.f, x.l, sn })
                .AsQueryable();

            if (isArchived.HasValue)
            {
                suggestionsQuery = suggestionsQuery.Where(x =>
                    x.b.IsArchived == isArchived.Value &&
                    x.f.IsArchived == isArchived.Value &&
                    x.l.IsArchived == isArchived.Value &&
                    x.sn.IsArchived == isArchived.Value &&
                    x.s.IsArchived == isArchived.Value);
            }

            if (!string.IsNullOrEmpty(building))
            {
                string buildingFilter = $"{building.Trim()}%";
                suggestionsQuery = suggestionsQuery.Where(x => EF.Functions.ILike(x.b.Name, buildingFilter));
            }
            if (!string.IsNullOrEmpty(floor))
            {
                string floorFilter = $"{floor.Trim()}%";
                suggestionsQuery = suggestionsQuery.Where(x => EF.Functions.ILike(x.f.Name, floorFilter));
            }
            if (!string.IsNullOrEmpty(line))
            {
                string lineFilter = $"{line.Trim()}%";
                suggestionsQuery = suggestionsQuery.Where(x => EF.Functions.ILike(x.l.Name, lineFilter));
            }
            if (!string.IsNullOrEmpty(storeNumber))
            {
                string storeNumberFilter = $"{storeNumber.Trim()}%";
                suggestionsQuery = suggestionsQuery.Where(x => EF.Functions.ILike(x.sn.Name, storeNumberFilter));
            }

            var suggestions = await suggestionsQuery
                .Select(x => x.b.Name + " " + x.f.Name + " " + x.l.Name + " " + x.sn.Name)
                .Distinct()
                .OrderBy(result => result)
                .Take(10)
                .ToListAsync();

            _memoryCache.Set(cacheKey, suggestions, TimeSpan.FromMinutes(10));
            _logger.LogInformation("Найдено {Count} результатов для запроса магазинов: query={Query}, isArchived={IsArchived}", suggestions.Count, query, isArchived);

            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении подсказок для магазинов: query={Query}, isArchived={IsArchived}", query, isArchived);
            return StatusCode(500, "Произошла ошибка на сервере при обработке запроса.");
        }
    }
}