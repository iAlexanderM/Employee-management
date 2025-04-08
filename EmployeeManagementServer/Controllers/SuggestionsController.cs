using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

[Authorize]
[ApiController]
[Route("api/suggestions")]
public class SuggestionsController : ControllerBase
{
    private readonly ISuggestionsService _suggestionsService;
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<SuggestionsController> _logger;

    public SuggestionsController(ISuggestionsService suggestionsService, ApplicationDbContext context, IMemoryCache cache, ILogger<SuggestionsController> logger)
    {
        _suggestionsService = suggestionsService;
        _context = context;
        _memoryCache = cache;
        _logger = logger;
    }

    [HttpGet("buildings")]
    public IActionResult GetBuildingSuggestions([FromQuery] string? query)
    {
        var suggestions = _suggestionsService.GetBuildingSuggestions(query ?? string.Empty);
        return Ok(suggestions);
    }

    [HttpGet("floors")]
    public IActionResult GetFloorSuggestions([FromQuery] string? query)
    {
        var suggestions = _suggestionsService.GetFloorSuggestions(query ?? string.Empty);
        return Ok(suggestions);
    }

    [HttpGet("lines")]
    public IActionResult GetLineSuggestions([FromQuery] string? query)
    {
        var suggestions = _suggestionsService.GetLineSuggestions(query ?? string.Empty);
        return Ok(suggestions);
    }

    [HttpGet("storeNumbers")]
    public IActionResult GetStoreNumberSuggestions([FromQuery] string? query)
    {
        var suggestions = _suggestionsService.GetStoreNumberSuggestions(query ?? string.Empty);
        return Ok(suggestions);
    }

    [HttpGet("contractors")]
    public async Task<IActionResult> GetContractorSuggestions([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(new List<ContractorDto>());
        }

        // Разделяем запрос по пробелам
        var queryParts = query.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        // Начинаем с полного набора контрагентов
        var suggestionsQuery = _context.Contractors.AsQueryable();

        // Для каждого термина в запросе добавляем условия поиска
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

        return Ok(suggestions);
    }

    [HttpGet("stores")]
    public async Task<IActionResult> GetStoreSuggestions([FromQuery] string query)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            {
                _logger.LogWarning("Пустой или слишком короткий запрос на подсказки.");
                return Ok(new List<string>());
            }

            var normalizedQuery = query.Trim().ToLower();
            if (_memoryCache.TryGetValue(normalizedQuery, out List<string> cachedSuggestions))
            {
                _logger.LogInformation($"Кешированные результаты для запроса: {query}");
                return Ok(cachedSuggestions);
            }

            _logger.LogInformation($"Выполнение поиска для запроса: {query}");
            var queryParts = query.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            string building = null, floor = null, line = null, storeNumber = null;
            if (queryParts.Length > 0) building = queryParts[0];
            if (queryParts.Length > 1) floor = queryParts[1];
            if (queryParts.Length > 2) line = queryParts[2];
            if (queryParts.Length > 3) storeNumber = queryParts[3];

            var suggestionsQuery = _context.Stores.AsQueryable();

            if (!string.IsNullOrEmpty(building))
            {
                string buildingFilter = $"{building.Trim()}%";
                suggestionsQuery = suggestionsQuery.Where(s => s.Building != null && EF.Functions.ILike(s.Building, buildingFilter));
            }
            if (!string.IsNullOrEmpty(floor))
            {
                string floorFilter = $"{floor.Trim()}%";
                suggestionsQuery = suggestionsQuery.Where(s => s.Floor != null && EF.Functions.ILike(s.Floor, floorFilter));
            }
            if (!string.IsNullOrEmpty(line))
            {
                string lineFilter = $"{line.Trim()}%";
                suggestionsQuery = suggestionsQuery.Where(s => s.Line != null && EF.Functions.ILike(s.Line, lineFilter));
            }
            if (!string.IsNullOrEmpty(storeNumber))
            {
                string storeNumberFilter = $"{storeNumber.Trim()}%";
                suggestionsQuery = suggestionsQuery.Where(s => s.StoreNumber != null && EF.Functions.ILike(s.StoreNumber, storeNumberFilter));
            }

            var suggestions = await suggestionsQuery
                .Select(s => (s.Building ?? "") + " " + (s.Floor ?? "") + " " + (s.Line ?? "") + " " + (s.StoreNumber ?? ""))
                .Distinct()
                .OrderBy(result => result)
                .Take(10)
                .ToListAsync();

            _memoryCache.Set(normalizedQuery, suggestions, TimeSpan.FromMinutes(10));
            _logger.LogInformation($"Найдено результатов: {suggestions.Count} для запроса: {query}");

            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении подсказок для магазинов для запроса: {Query}", query);
            return StatusCode(500, "Произошла ошибка на сервере при обработке запроса.");
        }
    }
}
