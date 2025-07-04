using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public class PassByStoreSearchService : IPassByStoreSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PassByStoreSearchService> _logger;
        private readonly IMemoryCache _cache;

        public PassByStoreSearchService(
            ApplicationDbContext context,
            ILogger<PassByStoreSearchService> logger,
            IMemoryCache cache)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        }

        private class StoreCache
        {
            public int StoreId { get; set; }
            public string? Building { get; set; }
            public string? Floor { get; set; }
            public string? Line { get; set; }
            public string? StoreNumber { get; set; }
            public string? Note { get; set; }
        }

        private class PassData
        {
            public Pass Pass { get; set; }
            public Store Store { get; set; }
            public Contractor Contractor { get; set; }
            public PassType PassType { get; set; }
            public PassTransaction? PassTransaction { get; set; }
        }

        private PassDetailsDto MapToPassDetailsDto(PassData passData, List<ContractorPhoto> contractorPhotos)
        {
            return new PassDetailsDto
            {
                Id = passData.Pass.Id,
                UniquePassId = passData.Pass.UniquePassId ?? "",
                PassTypeId = passData.Pass.PassTypeId,
                PassTypeName = passData.PassType?.Name ?? "",
                PassTypeColor = passData.PassType?.Color ?? "",
                PassTypeDurationInMonths = passData.PassType?.DurationInMonths ?? 0,
                Cost = passData.PassType?.Cost ?? passData.Pass.Cost,
                StartDate = passData.Pass.StartDate,
                EndDate = passData.Pass.EndDate,
                TransactionDate = passData.PassTransaction?.CreatedAt ?? passData.Pass.TransactionDate,
                ContractorName = $"{passData.Contractor.LastName ?? ""} {passData.Contractor.FirstName ?? ""} {passData.Contractor.MiddleName ?? ""}".Trim(),
                ContractorId = passData.Contractor.Id,
                IsClosed = passData.Pass.IsClosed,
                CloseReason = passData.Pass.CloseReason,
                ClosedBy = passData.Pass.ClosedByUserId,
                PassStatus = passData.Pass.PassStatus ?? (passData.Pass.IsClosed ? "Closed" : "Active"),
                PrintStatus = passData.Pass.PrintStatus ?? "PendingPrint",
                ContractorPhotoPath = contractorPhotos
                    .Where(ph => !ph.IsDocumentPhoto)
                    .OrderByDescending(ph => ph.Id)
                    .Select(ph => ph.FilePath)
                    .FirstOrDefault(),
                Position = passData.Pass.Position ?? "Unknown",
                Building = passData.Store.Building,
                Floor = passData.Store.Floor,
                Line = passData.Store.Line,
                StoreNumber = passData.Store.StoreNumber,
                StoreId = passData.Store.Id
            };
        }

        public async Task<List<PassByStoreResponseDto>> SearchPassesByStoreAsync(PassByStoreSearchDto searchDto)
        {
            var requestId = Guid.NewGuid();
            _logger.LogInformation("Начинается поиск с критериями: {@SearchDto}, RequestId={RequestId}", searchDto, requestId);

            // Нормализация и валидация входных данных
            searchDto.Normalize();
            if (searchDto.Page < 1) searchDto.Page = 1;
            if (searchDto.PageSize < 1 || searchDto.PageSize > 100) searchDto.PageSize = 100;

            // Кэширование данных магазина
            var cacheKey = $"Store_{searchDto.Building}_{searchDto.Floor}_{searchDto.Line}_{searchDto.StoreNumber}_{searchDto.IsArchived}";
            if (!_cache.TryGetValue(cacheKey, out StoreCache? store))
            {
                var storeQuery = _context.Stores
                    .AsNoTracking()
                    .Where(s => s.Building.Trim().ToLower() == searchDto.Building.Trim().ToLower() &&
                                s.Floor.Trim().ToLower() == searchDto.Floor.Trim().ToLower() &&
                                s.Line.Trim().ToLower() == searchDto.Line.Trim().ToLower() &&
                                s.StoreNumber.Trim().ToLower() == searchDto.StoreNumber.Trim().ToLower());

                if (searchDto.IsArchived.HasValue)
                {
                    storeQuery = storeQuery.Where(s => s.IsArchived == searchDto.IsArchived.Value);
                    _logger.LogDebug("Применён фильтр IsArchived: {IsArchived}, RequestId={RequestId}", searchDto.IsArchived.Value, requestId);
                }

                store = await storeQuery
                    .Select(s => new StoreCache
                    {
                        StoreId = s.Id,
                        Building = s.Building,
                        Floor = s.Floor,
                        Line = s.Line,
                        StoreNumber = s.StoreNumber,
                        Note = s.Note
                    })
                    .FirstOrDefaultAsync();

                if (store != null)
                {
                    _cache.Set(cacheKey, store, TimeSpan.FromMinutes(10));
                    _logger.LogDebug("Данные магазина закэшированы для ключа: {CacheKey}, RequestId={RequestId}", cacheKey, requestId);
                }
            }

            if (store == null)
            {
                _logger.LogInformation("Магазин не найден: Building={Building}, Floor={Floor}, Line={Line}, StoreNumber={StoreNumber}, IsArchived={IsArchived}, RequestId={RequestId}",
                    searchDto.Building, searchDto.Floor, searchDto.Line, searchDto.StoreNumber, searchDto.IsArchived, requestId);
                return new List<PassByStoreResponseDto>
                {
                    new PassByStoreResponseDto
                    {
                        StoreId = 0,
                        Building = searchDto.Building,
                        Floor = searchDto.Floor,
                        Line = searchDto.Line,
                        StoreNumber = searchDto.StoreNumber,
                        Note = searchDto.Note,
                        Contractors = new List<ContractorPassesDto>(),
                        TotalCount = 0,
                        Page = searchDto.Page,
                        PageSize = searchDto.PageSize
                    }
                };
            }

            bool showActive = searchDto.ShowActive ?? true;
            bool showClosed = searchDto.ShowClosed ?? false;

            if (!showActive && !showClosed)
            {
                _logger.LogWarning("ShowActive и ShowClosed оба false, возвращается пустой результат, RequestId={RequestId}", requestId);
                return new List<PassByStoreResponseDto>
                {
                    new PassByStoreResponseDto
                    {
                        StoreId = store.StoreId,
                        Building = store.Building,
                        Floor = store.Floor,
                        Line = store.Line,
                        StoreNumber = store.StoreNumber,
                        Note = store.Note,
                        Contractors = new List<ContractorPassesDto>(),
                        TotalCount = 0,
                        Page = searchDto.Page,
                        PageSize = searchDto.PageSize
                    }
                };
            }

            // Получение уникальных ID контрагентов для магазина с пагинацией, сортировка по максимальному Pass.Id
            IQueryable<int> contractorIdsQuery = _context.Passes
                .AsNoTracking()
                .Where(p => p.StoreId == store.StoreId)
                .Where(p => (showActive && (p.PassStatus == "Active" || (p.PassStatus == null && !p.IsClosed))) ||
                            (showClosed && (p.PassStatus == "Closed" || p.IsClosed)))
                .GroupBy(p => p.ContractorId)
                .Select(g => new
                {
                    ContractorId = g.Key,
                    MaxPassId = g.Max(p => p.Id)
                })
                .OrderByDescending(x => x.MaxPassId)
                .Select(x => x.ContractorId);

            var totalCount = await contractorIdsQuery.CountAsync();
            _logger.LogDebug("Всего уникальных контрагентов в таблице Passes: {TotalCount}, StoreId={StoreId}, RequestId={RequestId}",
                totalCount, store.StoreId, requestId);

            var contractorIds = await contractorIdsQuery
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToListAsync();

            _logger.LogDebug("Страница ID контрагентов: {ContractorIds}, Page={Page}, PageSize={PageSize}, RequestId={RequestId}",
                string.Join(",", contractorIds), searchDto.Page, searchDto.PageSize, requestId);

            if (!contractorIds.Any())
            {
                _logger.LogInformation("Контрагенты не найдены для магазина ID {StoreId}, Page={Page}, RequestId={RequestId}",
                    store.StoreId, searchDto.Page, requestId);
                return new List<PassByStoreResponseDto>
                {
                    new PassByStoreResponseDto
                    {
                        StoreId = store.StoreId,
                        Building = store.Building,
                        Floor = store.Floor,
                        Line = store.Line,
                        StoreNumber = store.StoreNumber,
                        Note = store.Note,
                        Contractors = new List<ContractorPassesDto>(),
                        TotalCount = totalCount,
                        Page = searchDto.Page,
                        PageSize = searchDto.PageSize
                    }
                };
            }

            // Получение всех пропусков для выбранных контрагентов (все магазины)
            var allPasses = await _context.Passes
                .AsNoTracking()
                .Where(p => contractorIds.Contains(p.ContractorId))
                .Join(_context.Stores,
                    p => p.StoreId,
                    s => s.Id,
                    (p, s) => new { Pass = p, Store = s })
                .Join(_context.Contractors,
                    ps => ps.Pass.ContractorId,
                    c => c.Id,
                    (ps, c) => new { ps.Pass, ps.Store, Contractor = c })
                .Join(_context.PassTypes,
                    pc => pc.Pass.PassTypeId,
                    pt => pt.Id,
                    (pc, pt) => new { pc.Pass, pc.Store, pc.Contractor, PassType = pt })
                .GroupJoin(_context.PassTransactions,
                    pc => pc.Pass.PassTransactionId,
                    pt => pt.Id,
                    (pc, pt) => new PassData
                    {
                        Pass = pc.Pass,
                        Store = pc.Store,
                        Contractor = pc.Contractor,
                        PassType = pc.PassType,
                        PassTransaction = pt.FirstOrDefault()
                    })
                .ToListAsync();

            _logger.LogDebug("Получено {PassCount} пропусков для {ContractorCount} контрагентов, RequestId={RequestId}",
                allPasses.Count, contractorIds.Count, requestId);

            // Получение фотографий контрагентов
            var photos = await _context.ContractorPhoto
                .AsNoTracking()
                .Where(cp => contractorIds.Contains(cp.ContractorId))
                .ToListAsync();

            // Группировка пропусков по контрагентам
            var groupedPasses = contractorIds
                .Select(cid =>
                {
                    var contractor = allPasses.FirstOrDefault(p => p.Contractor.Id == cid)?.Contractor;
                    if (contractor == null)
                    {
                        _logger.LogWarning("Контрагент не найден для ID {ContractorId}, StoreId={StoreId}, RequestId={RequestId}", cid, store.StoreId, requestId);
                        return null;
                    }

                    var contractorPhotos = photos.Where(p => p.ContractorId == contractor.Id).ToList();
                    var contractorDto = new ContractorPassesDto
                    {
                        ContractorId = contractor.Id,
                        ContractorName = $"{contractor.LastName ?? ""} {contractor.FirstName ?? ""} {contractor.MiddleName ?? ""}".Trim(),
                        ContractorPhotoPath = contractorPhotos
                            .Where(p => !p.IsDocumentPhoto)
                            .OrderByDescending(p => p.Id) 
                            .Select(p => p.FilePath)
                            .FirstOrDefault(),
                        DocumentPhotos = contractorPhotos
                            .Where(p => p.IsDocumentPhoto)
                            .Select(p => p.FilePath)
                            .Distinct()
                            .DefaultIfEmpty()
                            .Aggregate((a, b) => a != null && b != null ? $"{a},{b}" : a ?? b),
                        PhoneNumber = contractor.PhoneNumber,
                        Citizenship = contractor.Citizenship,
                        ProductType = contractor.ProductType,
                        ActivePasses = allPasses
                            .Where(p => p.Contractor.Id == cid && (p.Pass.PassStatus == "Active" || (p.Pass.PassStatus == null && !p.Pass.IsClosed)))
                            .Select(p => MapToPassDetailsDto(p, contractorPhotos))
                            .DistinctBy(p => p.Id)
                            .OrderByDescending(p => p.Id)
                            .ToList(),
                        ClosedPasses = allPasses
                            .Where(p => p.Contractor.Id == cid && (p.Pass.PassStatus == "Closed" || p.Pass.IsClosed))
                            .Select(p => MapToPassDetailsDto(p, contractorPhotos))
                            .DistinctBy(p => p.Id)
                            .OrderByDescending(p => p.Id) 
                            .ToList()
                    };
                    _logger.LogDebug("Контрагент {ContractorId}: ActivePasses={ActivePassCount}, ClosedPasses={ClosedPassCount}, RequestId={RequestId}",
                        cid, contractorDto.ActivePasses.Count, contractorDto.ClosedPasses.Count, requestId);
                    return contractorDto;
                })
                .Where(dto => dto != null)
                .Cast<ContractorPassesDto>()
                .ToList();

            var result = new List<PassByStoreResponseDto>
            {
                new PassByStoreResponseDto
                {
                    StoreId = store.StoreId,
                    Building = store.Building,
                    Floor = store.Floor,
                    Line = store.Line,
                    StoreNumber = store.StoreNumber,
                    Note = store.Note,
                    Contractors = groupedPasses,
                    TotalCount = totalCount,
                    Page = searchDto.Page,
                    PageSize = searchDto.PageSize
                }
            };

            _logger.LogInformation("Поиск завершён: Найдено {ContractorCount} контрагентов для магазина ID {StoreId}, TotalCount={TotalCount}, Page={Page}, PageSize={PageSize}, RequestId={RequestId}",
                groupedPasses.Count, store.StoreId, totalCount, searchDto.Page, searchDto.PageSize, requestId);

            return result;
        }
    }
}