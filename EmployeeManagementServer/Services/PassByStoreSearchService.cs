using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.Extensions.Logging;

namespace EmployeeManagementServer.Services
{
    public class PassByStoreSearchService : IPassByStoreSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PassByStoreSearchService> _logger;

        public PassByStoreSearchService(ApplicationDbContext context, ILogger<PassByStoreSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<PassByStoreResponseDto>> SearchPassesByStoreAsync(PassByStoreSearchDto searchDto)
        {
            _logger.LogInformation("Начало поиска с критериями: {@SearchDto}", searchDto);

            var storeQuery = _context.Stores
                .Where(s => s.Building == searchDto.Building &&
                            s.Floor == searchDto.Floor &&
                            s.Line == searchDto.Line &&
                            s.StoreNumber == searchDto.StoreNumber);

            if (searchDto.IsArchived.HasValue)
            {
                storeQuery = storeQuery.Where(s => s.IsArchived == searchDto.IsArchived.Value);
                _logger.LogDebug("Применён фильтр IsArchived: {IsArchived}", searchDto.IsArchived.Value);
            }

            var store = await storeQuery
                .Select(s => new
                {
                    StoreId = s.Id,
                    Building = s.Building,
                    Floor = s.Floor,
                    Line = s.Line,
                    StoreNumber = s.StoreNumber
                })
                .FirstOrDefaultAsync();

            if (store == null)
            {
                _logger.LogInformation("Магазин с указанными параметрами не найден: Building={Building}, Floor={Floor}, Line={Line}, StoreNumber={StoreNumber}, IsArchived={IsArchived}",
                    searchDto.Building, searchDto.Floor, searchDto.Line, searchDto.StoreNumber, searchDto.IsArchived);
                throw new Exception($"М ascended stores not found with parameters Building: {searchDto.Building}, Floor: {searchDto.Floor}, Line: {searchDto.Line}, StoreNumber: {searchDto.StoreNumber}{(searchDto.IsArchived.HasValue ? $", IsArchived: {searchDto.IsArchived}" : "")}.");
            }

            // Остальная часть метода остаётся без изменений
            var storeQueryPasses = _context.Passes
                .Include(p => p.Store)
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                    .ThenInclude(c => c.Photos)
                .Include(p => p.PassTransaction)
                .Where(p => p.StoreId == store.StoreId)
                .AsQueryable();

            bool showActive = searchDto.ShowActive ?? true;
            bool showClosed = searchDto.ShowClosed ?? true;
            if (!showActive && !showClosed)
            {
                _logger.LogWarning("Фильтры ShowActive и ShowClosed оба false, возвращаем пустой результат.");
                return new List<PassByStoreResponseDto>
                {
                    new PassByStoreResponseDto
                    {
                        StoreId = store.StoreId,
                        Building = store.Building,
                        Floor = store.Floor,
                        Line = store.Line,
                        StoreNumber = store.StoreNumber,
                        Contractors = new List<ContractorPassesDto>()
                    }
                };
            }

            if (!showActive)
                storeQueryPasses = storeQueryPasses.Where(p => p.PassStatus == "Closed");
            if (!showClosed)
                storeQueryPasses = storeQueryPasses.Where(p => p.PassStatus == "Active" || p.PassStatus == null && !p.IsClosed);

            var storePasses = await storeQueryPasses
                .GroupBy(p => p.StoreId)
                .Select(g => new
                {
                    StoreId = g.Key,
                    Building = g.First().Store.Building,
                    Floor = g.First().Store.Floor,
                    Line = g.First().Store.Line,
                    StoreNumber = g.First().Store.StoreNumber,
                    ContractorIds = g.Select(p => p.ContractorId).Distinct().ToList()
                })
                .ToListAsync();

            if (!storePasses.Any())
            {
                _logger.LogInformation("Пропусков для магазина с ID {StoreId} не найдено.", store.StoreId);
                return new List<PassByStoreResponseDto>
                {
                    new PassByStoreResponseDto
                    {
                        StoreId = store.StoreId,
                        Building = store.Building,
                        Floor = store.Floor,
                        Line = store.Line,
                        StoreNumber = store.StoreNumber,
                        Contractors = new List<ContractorPassesDto>()
                    }
                };
            }

            var allContractorIds = storePasses.SelectMany(sp => sp.ContractorIds).Distinct().ToList();
            _logger.LogInformation("Найдено контрагентов на точке: {Count}", allContractorIds.Count);

            var allPasses = await _context.Passes
                .Include(p => p.Store)
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                    .ThenInclude(c => c.Photos)
                .Include(p => p.PassTransaction)
                .Where(p => allContractorIds.Contains(p.ContractorId))
                .ToListAsync();

            var allContractors = await _context.Contractors
                .Include(c => c.Photos)
                .Where(c => allContractorIds.Contains(c.Id))
                .ToListAsync();

            var result = storePasses.Select(sp => new PassByStoreResponseDto
            {
                StoreId = sp.StoreId,
                Building = sp.Building,
                Floor = sp.Floor,
                Line = sp.Line,
                StoreNumber = sp.StoreNumber,
                Contractors = allContractors
                    .Where(c => sp.ContractorIds.Contains(c.Id))
                    .Select(c => new ContractorPassesDto
                    {
                        ContractorId = c.Id,
                        ContractorName = c.LastName + " " + c.FirstName + " " + c.MiddleName,
                        ContractorPhotoPath = c.Photos != null && c.Photos.Any(p => !p.IsDocumentPhoto)
                            ? c.Photos.First(p => !p.IsDocumentPhoto).FilePath
                            : null,
                        DocumentPhotos = c.Photos != null && c.Photos.Any(p => p.IsDocumentPhoto)
                            ? string.Join(",", c.Photos.Where(p => p.IsDocumentPhoto).Select(p => p.FilePath))
                            : null,
                        PhoneNumber = c.PhoneNumber,
                        Citizenship = c.Citizenship,
                        ProductType = c.ProductType,
                        ActivePasses = allPasses
                            .Where(p => p.ContractorId == c.Id &&
                                        (p.PassStatus == "Active" || (p.PassStatus == null && !p.IsClosed)) &&
                                        p.Store.Building == searchDto.Building &&
                                        p.Store.Floor == searchDto.Floor &&
                                        p.Store.Line == searchDto.Line &&
                                        p.Store.StoreNumber == searchDto.StoreNumber)
                            .Select(p => new PassDetailsDto
                            {
                                Id = p.Id,
                                UniquePassId = p.UniquePassId,
                                PassTypeId = p.PassTypeId,
                                PassTypeName = p.PassType.Name,
                                PassTypeColor = p.PassType.Color,
                                PassTypeDurationInMonths = p.PassType.DurationInMonths,
                                Cost = p.PassType.Cost,
                                StartDate = p.StartDate,
                                EndDate = p.EndDate,
                                TransactionDate = p.TransactionDate,
                                ContractorName = c.LastName + " " + c.FirstName + " " + c.MiddleName,
                                ContractorId = c.Id,
                                IsClosed = p.IsClosed,
                                CloseReason = p.CloseReason,
                                PassStatus = p.PassStatus,
                                PrintStatus = p.PrintStatus,
                                ContractorPhotoPath = c.Photos != null && c.Photos.Any(p => !p.IsDocumentPhoto)
                                    ? c.Photos.First(p => !p.IsDocumentPhoto).FilePath
                                    : null,
                                Position = p.Position,
                                Building = p.Store.Building,
                                Floor = p.Store.Floor,
                                Line = p.Store.Line,
                                StoreNumber = p.Store.StoreNumber
                            }).ToList(),
                        ClosedPasses = allPasses
                            .Where(p => p.ContractorId == c.Id &&
                                        (p.IsClosed || p.PassStatus == "Closed") &&
                                        p.Store.Building == searchDto.Building &&
                                        p.Store.Floor == searchDto.Floor &&
                                        p.Store.Line == searchDto.Line &&
                                        p.Store.StoreNumber == searchDto.StoreNumber)
                            .Select(p => new PassDetailsDto
                            {
                                Id = p.Id,
                                UniquePassId = p.UniquePassId,
                                PassTypeId = p.PassTypeId,
                                PassTypeName = p.PassType.Name,
                                PassTypeColor = p.PassType.Color,
                                PassTypeDurationInMonths = p.PassType.DurationInMonths,
                                Cost = p.PassType.Cost,
                                StartDate = p.StartDate,
                                EndDate = p.EndDate,
                                TransactionDate = p.TransactionDate,
                                ContractorName = c.LastName + " " + c.FirstName + " " + c.MiddleName,
                                ContractorId = c.Id,
                                IsClosed = p.IsClosed,
                                CloseReason = p.CloseReason,
                                PassStatus = p.PassStatus,
                                PrintStatus = p.PrintStatus,
                                ContractorPhotoPath = c.Photos != null && c.Photos.Any(p => !p.IsDocumentPhoto)
                                    ? c.Photos.First(p => !p.IsDocumentPhoto).FilePath
                                    : null,
                                Position = p.PassTransaction != null ? p.PassTransaction.Position : p.Position,
                                Building = p.Store.Building,
                                Floor = p.Store.Floor,
                                Line = p.Store.Line,
                                StoreNumber = p.Store.StoreNumber
                            }).ToList(),
                        AllActivePasses = allPasses
                            .Where(p => p.ContractorId == c.Id &&
                                        (p.PassStatus == "Active" || (p.PassStatus == null && !p.IsClosed)))
                            .Select(p => new PassDetailsDto
                            {
                                Id = p.Id,
                                UniquePassId = p.UniquePassId,
                                PassTypeId = p.PassTypeId,
                                PassTypeName = p.PassType.Name,
                                PassTypeColor = p.PassType.Color,
                                PassTypeDurationInMonths = p.PassType.DurationInMonths,
                                Cost = p.PassType.Cost,
                                StartDate = p.StartDate,
                                EndDate = p.EndDate,
                                TransactionDate = p.TransactionDate,
                                ContractorName = c.LastName + " " + c.FirstName + " " + c.MiddleName,
                                ContractorId = c.Id,
                                IsClosed = p.IsClosed,
                                CloseReason = p.CloseReason,
                                PassStatus = p.PassStatus,
                                PrintStatus = p.PrintStatus,
                                ContractorPhotoPath = c.Photos != null && c.Photos.Any(p => !p.IsDocumentPhoto)
                                    ? c.Photos.First(p => !p.IsDocumentPhoto).FilePath
                                    : null,
                                Position = p.Position,
                                Building = p.Store.Building,
                                Floor = p.Store.Floor,
                                Line = p.Store.Line,
                                StoreNumber = p.Store.StoreNumber
                            }).ToList()
                    }).ToList()
            }).ToList();

            _logger.LogInformation("Поиск завершён. Найдено магазинов с пропусками: {Count}", result.Count);
            if (result.Any())
            {
                _logger.LogDebug("Пример результата: {@FirstResult}", result.First());
            }
            return result;
        }

        private IQueryable<Pass> ApplyStoreFilters(IQueryable<Pass> query, PassByStoreSearchDto searchDto)
        {
            if (searchDto.StoreId.HasValue)
            {
                query = query.Where(p => p.StoreId == searchDto.StoreId.Value);
                _logger.LogDebug("Применён фильтр StoreId: {StoreId}", searchDto.StoreId.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.Building))
            {
                string buildingFilter = $"{searchDto.Building.Trim()}%";
                query = query.Where(p => EF.Functions.ILike(p.Store.Building, buildingFilter));
                _logger.LogDebug("Применён фильтр Building: {BuildingFilter}", buildingFilter);
            }

            if (!string.IsNullOrEmpty(searchDto.Floor))
            {
                string floorFilter = $"{searchDto.Floor.Trim()}%";
                query = query.Where(p => EF.Functions.ILike(p.Store.Floor, floorFilter));
                _logger.LogDebug("Применён фильтр Floor: {FloorFilter}", floorFilter);
            }

            if (!string.IsNullOrEmpty(searchDto.Line))
            {
                string lineFilter = $"{searchDto.Line.Trim()}%";
                query = query.Where(p => EF.Functions.ILike(p.Store.Line, lineFilter));
                _logger.LogDebug("Применён фильтр Line: {LineFilter}", lineFilter);
            }

            if (!string.IsNullOrEmpty(searchDto.StoreNumber))
            {
                string storeNumberFilter = $"{searchDto.StoreNumber.Trim()}%";
                query = query.Where(p => EF.Functions.ILike(p.Store.StoreNumber, storeNumberFilter));
                _logger.LogDebug("Применён фильтр StoreNumber: {StoreNumberFilter}", storeNumberFilter);
            }

            return query;
        }
    }
}