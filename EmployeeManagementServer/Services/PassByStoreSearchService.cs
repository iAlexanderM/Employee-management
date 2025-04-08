﻿using Microsoft.EntityFrameworkCore;
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

            var storeQuery = _context.Passes
                .Include(p => p.Store)
                .Include(p => p.PassType)
                .Include(p => p.Contractor)
                    .ThenInclude(c => c.Photos)
                .Include(p => p.PassTransaction)
                .AsQueryable();

            storeQuery = ApplyStoreFilters(storeQuery, searchDto);

            bool showActive = searchDto.ShowActive ?? true;
            bool showClosed = searchDto.ShowClosed ?? true;
            if (!showActive && !showClosed)
            {
                _logger.LogWarning("Фильтры ShowActive и ShowClosed оба false, возвращаем пустой результат.");
                return new List<PassByStoreResponseDto>();
            }

            if (!showActive)
                storeQuery = storeQuery.Where(p => p.PassStatus == "Closed");
            if (!showClosed)
                storeQuery = storeQuery.Where(p => p.PassStatus == "Active" || p.PassStatus == null && !p.IsClosed);

            var storePasses = await storeQuery
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
                _logger.LogInformation("Пропусков на указанной точке не найдено.");
                return new List<PassByStoreResponseDto>();
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

            _logger.LogInformation("Всего пропусков для ContractorId=2: {Count}", allPasses.Count(p => p.ContractorId == 2));
            _logger.LogInformation("Активных пропусков для ContractorId=2: {Count}", allPasses.Count(p => p.ContractorId == 2 && (p.PassStatus == "Active" || (p.PassStatus == null && !p.IsClosed))));

            var allContractors = await _context.Contractors
                .Include(c => c.Photos)
                .Where(c => allContractorIds.Contains(c.Id))
                .ToListAsync();

            _logger.LogInformation("Всего пропусков для найденных контрагентов: {Count}", allPasses.Count);

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