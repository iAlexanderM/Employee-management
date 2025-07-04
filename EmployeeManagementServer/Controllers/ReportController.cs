using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using EmployeeManagementServer.Data;
using EmployeeManagementServer.Services;
using EmployeeManagementServer.Models.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPassTransactionSearchService _passTransactionSearchService;
        private readonly IPassByStoreSearchService _passByStoreSearchService;
        private readonly IQueueService _queueService;

        public ReportController(
            ApplicationDbContext context,
            IPassTransactionSearchService passTransactionSearchService,
            IPassByStoreSearchService passByStoreSearchService,
            IQueueService queueService)
        {
            _context = context;
            _passTransactionSearchService = passTransactionSearchService;
            _passByStoreSearchService = passByStoreSearchService;
            _queueService = queueService;
        }

        [HttpGet("financial-data")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetFinancialReportData(DateTime startDate, DateTime endDate)
        {
            try
            {
                endDate = endDate.Date.AddDays(1).AddTicks(-1);
                var searchDto = new PassTransactionSearchDto { CreatedAfter = startDate, CreatedBefore = endDate };
                var (totalCount, transactions) = await _passTransactionSearchService.SearchPassTransactionsAsync(searchDto, 0, 10000); 

                Console.WriteLine($"Transactions found: {transactions.Count}");
                var groupedData = transactions
                    .GroupBy(t => t.TokenType == "P" ? "Пропуск" : t.TokenType)
                    .Select(g => new
                    {
                        TokenType = g.Key,
                        PaidAmount = g.Where(t => t.Status?.Trim() == "Оплачено").Sum(t => t.Amount),
                        TransactionCount = g.Count()
                    })
                    .ToList(); // Explicit ToList to avoid multiple enumerations

                return Ok(groupedData);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetFinancialReportData: {ex.Message}");
                return StatusCode(500, "An error occurred while processing the request.");
            }
        }

        [HttpGet("financial")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetFinancialReport(DateTime startDate, DateTime endDate)
        {
            endDate = endDate.Date.AddDays(1).AddTicks(-1);
            return await GenerateExcel("financial", startDate, endDate);
        }

        [HttpGet("passes-summary-data")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetPassesSummaryReportData(DateTime startDate, DateTime endDate)
        {
            try
            {
                endDate = endDate.Date.AddDays(1).AddTicks(-1);

                var query = from p in _context.Passes.AsNoTracking()
                            join pt in _context.PassTransactions.AsNoTracking() on p.PassTransactionId equals pt.Id
                            join qt in _context.QueueTokens.AsNoTracking() on pt.Token equals qt.Token into queueTokens
                            from qt in queueTokens.DefaultIfEmpty()
                            where pt.CreatedAt >= startDate && pt.CreatedAt <= endDate
                            group new { p.PassType.Cost, QueueTokenType = qt != null ? qt.TokenType : "Неизвестно" } by qt != null ? qt.TokenType : "Неизвестно" into g
                            select new
                            {
                                QueueType = g.Key == "P" ? "Пропуск" : g.Key,
                                TotalAmount = g.Sum(x => x.Cost),
                                PassCount = g.Count()
                            };

                var groupedData = await query.ToListAsync();
                Console.WriteLine($"Passes summary data: {groupedData.Count} groups");
                return Ok(groupedData);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPassesSummaryReportData: {ex.Message}");
                return StatusCode(500, "An error occurred while processing the request.");
            }
        }

        [HttpGet("passes-summary")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetPassesSummaryReport(DateTime startDate, DateTime endDate)
        {
            endDate = endDate.Date.AddDays(1).AddTicks(-1);
            return await GenerateExcel("passes-summary", startDate, endDate);
        }

        [HttpGet("passes-summary-details")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetPassesSummaryDetails(string queueType, DateTime startDate, DateTime endDate)
        {
            try
            {
                endDate = endDate.Date.AddDays(1).AddTicks(-1);
                var effectiveQueueType = queueType == "Пропуск" ? "P" : queueType;

                var detailsQuery = from p in _context.Passes.AsNoTracking()
                                   join pt in _context.PassTransactions.AsNoTracking() on p.PassTransactionId equals pt.Id
                                   join qt in _context.QueueTokens.AsNoTracking() on pt.Token equals qt.Token into queueTokens
                                   from qt in queueTokens.DefaultIfEmpty()
                                   where pt.CreatedAt >= startDate && pt.CreatedAt <= endDate
                                   && (qt != null ? qt.TokenType : "Неизвестно") == effectiveQueueType
                                   group new { p.PassType.Name, p.PassType.Cost } by p.PassType.Name into g
                                   select new
                                   {
                                       PassType = g.Key,
                                       Amount = g.Sum(x => x.Cost),
                                       Count = g.Count()
                                   };

                var details = await detailsQuery.ToListAsync();
                Console.WriteLine($"Details for {queueType}: {details.Count}");
                return Ok(details);
            }
            catch (TimeoutException ex)
            {
                Console.WriteLine($"Timeout error in GetPassesSummaryDetails: {ex.Message}");
                return StatusCode(500, "Database query timed out. Please try again later.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPassesSummaryDetails: {ex.Message}");
                return StatusCode(500, "An error occurred while processing the request.");
            }
        }

        [HttpGet("active-passes-data")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetActivePassesReportData(
    string? passType = null,
    string? building = null,
    string? floor = null,
    string? line = null,
    int page = 1,
    int pageSize = 50,
    bool disablePagination = false)
        {
            try
            {
                if (!disablePagination)
                {
                    if (page < 1) page = 1;
                    if (pageSize < 1) pageSize = 50;
                }

                var query = _context.Passes
                    .AsNoTracking()
                    .Where(p => !p.IsClosed);

                if (!string.IsNullOrEmpty(passType)) query = query.Where(p => p.PassType.Name == passType);
                if (!string.IsNullOrEmpty(building)) query = query.Where(p => p.Store.Building == building);
                if (!string.IsNullOrEmpty(floor)) query = query.Where(p => p.Store.Floor == floor);
                if (!string.IsNullOrEmpty(line)) query = query.Where(p => p.Store.Line == line);

                var totalCount = await query.CountAsync();

                var passesQuery = query
                    .OrderBy(p => p.StartDate)
                    .Select(p => new
                    {
                        PassType = p.PassType.Name,
                        Building = p.Store.Building,
                        Floor = p.Store.Floor,
                        Line = p.Store.Line,
                        StoreNumber = p.Store.StoreNumber,
                        ContractorId = p.ContractorId,
                        FullName = $"{p.Contractor.LastName} {p.Contractor.FirstName} {p.Contractor.MiddleName}".Trim(),
                        Position = p.Position ?? "",
                        StartDate = p.StartDate,
                        EndDate = p.EndDate,
                        PassNumber = $"{p.StoreId}-{p.ContractorId}",
                        Citizenship = p.Contractor.Citizenship ?? "",
                        Nationality = p.Contractor.Nationality ?? "",
                        Phone = p.Contractor.PhoneNumber ?? "",
                        DocumentType = p.Contractor.DocumentType ?? "",
                        PassportSerialNumber = p.Contractor.PassportSerialNumber ?? "",
                        PassportIssuedBy = p.Contractor.PassportIssuedBy ?? "",
                        PassportIssueDate = p.Contractor.PassportIssueDate,
                        ProductType = p.Contractor.ProductType ?? "",
                        BirthDate = p.Contractor.BirthDate
                    });

                var passes = disablePagination
                    ? await passesQuery.ToListAsync()
                    : await passesQuery
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToListAsync();

                Console.WriteLine($"Active passes found: {passes.Count} (Page: {page}, PageSize: {pageSize}, Total: {totalCount})");
                return Ok(new { TotalCount = totalCount, Data = passes });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetActivePassesReportData: {ex.Message}");
                return StatusCode(500, "An error occurred while processing the request.");
            }
        }

        [HttpGet("active-passes")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetActivePassesReport(
            string? passType = null,
            string? building = null,
            string? floor = null,
            string? line = null)
        {
            return await GenerateExcel("active-passes", null, null, building, floor, line, null, passType);
        }

        [HttpGet("issued-passes-data")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetIssuedPassesReportData(
    DateTime startDate,
    DateTime endDate,
    string? building = null,
    string? floor = null,
    string? line = null,
    string? passType = null,
    int page = 1,
    int pageSize = 50,
    bool disablePagination = false)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 50;
                endDate = endDate.Date.AddDays(1).AddTicks(-1);

                var query = _context.Passes
                    .AsNoTracking()
                    .Where(p => p.StartDate >= startDate && p.StartDate <= endDate);

                if (!string.IsNullOrEmpty(building)) query = query.Where(p => p.Store.Building == building);
                if (!string.IsNullOrEmpty(floor)) query = query.Where(p => p.Store.Floor == floor);
                if (!string.IsNullOrEmpty(line)) query = query.Where(p => p.Store.Line == line);
                if (!string.IsNullOrEmpty(passType)) query = query.Where(p => p.PassType.Name == passType);

                var totalCount = await query.CountAsync();
                Console.WriteLine($"Total issued passes count: {totalCount}");

                var passesQuery = query
                    .OrderBy(p => p.StartDate)
                    .Select(p => new
                    {
                        PassType = p.PassType.Name ?? "",
                        Building = p.Store.Building ?? "",
                        Floor = p.Store.Floor ?? "",
                        Line = p.Store.Line ?? "",
                        StoreNumber = p.Store.StoreNumber ?? "",
                        ContractorId = p.ContractorId,
                        FullName = $"{p.Contractor.LastName} {p.Contractor.FirstName} {p.Contractor.MiddleName}".Trim(),
                        Position = p.Position ?? "",
                        Citizenship = p.Contractor.Citizenship ?? "",
                        Nationality = p.Contractor.Nationality ?? "",
                        StartDate = p.StartDate,
                        EndDate = p.EndDate,
                        Status = p.IsClosed ? "Closed" : "Active",
                        Phone = p.Contractor.PhoneNumber ?? "",
                        ProductType = p.Contractor.ProductType ?? ""
                    });

                var passes = disablePagination
                    ? await passesQuery.ToListAsync()
                    : await passesQuery
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToListAsync();

                Console.WriteLine($"Issued passes found: {passes.Count} (Page: {page}, PageSize: {pageSize}, Total: {totalCount})");
                return Ok(new { TotalCount = totalCount, Data = passes });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetIssuedPassesReportData: {ex.Message}");
                return StatusCode(500, "An error occurred while processing the request.");
            }
        }

        [HttpGet("issued-passes")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetIssuedPassesReport(
            DateTime startDate,
            DateTime endDate,
            string? building = null,
            string? floor = null,
            string? line = null,
            string? passType = null)
        {
            endDate = endDate.Date.AddDays(1).AddTicks(-1);
            return await GenerateExcel("issued-passes", startDate, endDate, building, floor, line, null, passType);
        }

        [HttpGet("expiring-passes-data")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetExpiringPassesReportData(
    DateTime startDate,
    DateTime endDate,
    int page = 1,
    int pageSize = 50,
    bool disablePagination = false)
        {
            try
            {
                if (!disablePagination)
                {
                    if (page < 1) page = 1;
                    if (pageSize < 1) pageSize = 50;
                }
                endDate = endDate.Date.AddDays(1).AddTicks(-1);

                var query = _context.Passes
                    .AsNoTracking()
                    .Where(p => !p.IsClosed && p.EndDate >= startDate && p.EndDate <= endDate);

                var totalCount = await query.CountAsync();

                var passesQuery = query
                    .OrderBy(p => p.EndDate)
                    .Select(p => new
                    {
                        PassType = p.PassType.Name ?? "",
                        EndDate = p.EndDate,
                        Building = p.Store.Building ?? "",
                        Floor = p.Store.Floor ?? "",
                        Line = p.Store.Line ?? "",
                        StoreNumber = p.Store.StoreNumber ?? "",
                        ContractorId = p.ContractorId,
                        FullName = $"{p.Contractor.LastName} {p.Contractor.FirstName} {p.Contractor.MiddleName}".Trim(),
                        Position = p.Position ?? "",
                        Note = p.Contractor.Note ?? ""
                    });

                var passes = disablePagination
                    ? await passesQuery.ToListAsync()
                    : await passesQuery
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToListAsync();

                Console.WriteLine($"Expiring passes found: {passes.Count} (Page: {page}, PageSize: {pageSize}, Total: {totalCount})");
                return Ok(new { TotalCount = totalCount, Data = passes });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetExpiringPassesReportData: {ex.Message}");
                return StatusCode(500, "An error occurred while processing the request.");
            }
        }

        [HttpGet("expiring-passes")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetExpiringPassesReport(DateTime startDate, DateTime endDate)
        {
            endDate = endDate.Date.AddDays(1).AddTicks(-1);
            return await GenerateExcel("expiring-passes", startDate, endDate);
        }

        [HttpGet("suggestions/building")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetBuildingSuggestions([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return Ok(new List<string>());
            var suggestions = await _context.Stores
                .Where(s => EF.Functions.ILike(s.Building, $"%{query}%"))
                .Select(s => s.Building)
                .Distinct()
                .Take(10)
                .ToListAsync();
            return Ok(suggestions);
        }

        [HttpGet("suggestions/floor")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetFloorSuggestions([FromQuery] string query, [FromQuery] string? building = null)
        {
            if (string.IsNullOrWhiteSpace(query)) return Ok(new List<string>());
            var queryable = _context.Stores.AsQueryable();
            if (!string.IsNullOrEmpty(building)) queryable = queryable.Where(s => s.Building == building);
            var suggestions = await queryable
                .Where(s => EF.Functions.ILike(s.Floor, $"%{query}%"))
                .Select(s => s.Floor)
                .Distinct()
                .Take(10)
                .ToListAsync();
            return Ok(suggestions);
        }

        [HttpGet("suggestions/line")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetLineSuggestions([FromQuery] string query, [FromQuery] string? building = null, [FromQuery] string? floor = null)
        {
            if (string.IsNullOrWhiteSpace(query)) return Ok(new List<string>());
            var queryable = _context.Stores.AsQueryable();
            if (!string.IsNullOrEmpty(building)) queryable = queryable.Where(s => s.Building == building);
            if (!string.IsNullOrEmpty(floor)) queryable = queryable.Where(s => s.Floor == floor);
            var suggestions = await queryable
                .Where(s => EF.Functions.ILike(s.Line, $"%{query}%"))
                .Select(s => s.Line)
                .Distinct()
                .Take(10)
                .ToListAsync();
            return Ok(suggestions);
        }

        private async Task<IActionResult> GenerateExcel(
    string reportType,
    DateTime? startDate = null,
    DateTime? endDate = null,
    string? building = null,
    string? floor = null,
    string? line = null,
    int? passTypeId = null,
    string? passType = null)
        {
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add($"{reportType}-report");
                int row = 1;

                switch (reportType)
                {
                    case "financial":
                        var financialData = await GetFinancialReportData(startDate!.Value, endDate!.Value);
                        if (!(financialData is OkObjectResult financialOkResult))
                        {
                            Console.WriteLine($"Error: Financial report data returned non-OK result: {financialData}");
                            return StatusCode(500, "Failed to retrieve financial report data");
                        }
                        var financialItems = financialOkResult.Value as IEnumerable<dynamic>;
                        if (financialItems == null)
                        {
                            Console.WriteLine("Error: Financial report items are null");
                            return StatusCode(500, "Financial report data is empty");
                        }
                        worksheet.Cell(row, 1).Value = "Тип оплаты";
                        worksheet.Cell(row, 2).Value = "Оплачено на сумму";
                        worksheet.Cell(row, 3).Value = "Создано транзакций";
                        row++;
                        foreach (var item in financialItems)
                        {
                            worksheet.Cell(row, 1).Value = item.TokenType ?? "";
                            worksheet.Cell(row, 2).Value = item.PaidAmount;
                            worksheet.Cell(row, 3).Value = item.TransactionCount;
                            row++;
                        }
                        break;

                    case "passes-summary":
                        var summaryData = await GetPassesSummaryReportData(startDate!.Value, endDate!.Value);
                        if (!(summaryData is OkObjectResult summaryOkResult))
                        {
                            Console.WriteLine($"Error: Passes summary report data returned non-OK result: {summaryData}");
                            return StatusCode(500, "Failed to retrieve passes summary report data");
                        }
                        var summaryItems = summaryOkResult.Value as IEnumerable<dynamic>;
                        if (summaryItems == null)
                        {
                            Console.WriteLine("Error: Passes summary report items are null");
                            return StatusCode(500, "Passes summary report data is empty");
                        }
                        worksheet.Cell(row, 1).Value = "Тип очереди";
                        worksheet.Cell(row, 2).Value = "Сумма по типу очереди";
                        worksheet.Cell(row, 3).Value = "Количество пропусков";
                        row++;
                        foreach (var item in summaryItems)
                        {
                            worksheet.Cell(row, 1).Value = item.QueueType ?? "";
                            worksheet.Cell(row, 2).Value = item.TotalAmount;
                            worksheet.Cell(row, 3).Value = item.PassCount;
                            row++;
                        }
                        break;

                    case "issued-passes":
                        var issuedData = await GetIssuedPassesReportData(startDate!.Value, endDate!.Value, building, floor, line, passType, disablePagination: true);
                        if (!(issuedData is OkObjectResult issuedOkResult))
                        {
                            Console.WriteLine($"Error: Issued passes report data returned non-OK result: {issuedData}");
                            return StatusCode(500, "Failed to retrieve issued passes report data");
                        }
                        var issuedResult = issuedOkResult.Value as dynamic;
                        if (issuedResult == null || issuedResult.Data == null)
                        {
                            Console.WriteLine("Error: Issued passes report data or Data property is null");
                            return StatusCode(500, "Issued passes report data is empty");
                        }
                        var issuedItems = issuedResult.Data as IEnumerable<dynamic>;
                        if (issuedItems == null)
                        {
                            Console.WriteLine("Error: Issued passes report items are null");
                            return StatusCode(500, "Issued passes report items are empty");
                        }
                        Console.WriteLine($"Issued passes items count: {issuedItems.Count()}");
                        worksheet.Cell(row, 1).Value = "Тип пропуска";
                        worksheet.Cell(row, 2).Value = "Здание";
                        worksheet.Cell(row, 3).Value = "Этаж";
                        worksheet.Cell(row, 4).Value = "Линия";
                        worksheet.Cell(row, 5).Value = "Торговая точка";
                        worksheet.Cell(row, 6).Value = "Код контрагента";
                        worksheet.Cell(row, 7).Value = "ФИО";
                        worksheet.Cell(row, 8).Value = "Должность";
                        worksheet.Cell(row, 9).Value = "Гражданство";
                        worksheet.Cell(row, 10).Value = "Национальность";
                        worksheet.Cell(row, 11).Value = "Дата начала";
                        worksheet.Cell(row, 12).Value = "Дата окончания";
                        worksheet.Cell(row, 13).Value = "Статус";
                        worksheet.Cell(row, 14).Value = "Телефон";
                        worksheet.Cell(row, 15).Value = "Группа товаров";
                        row++;
                        foreach (var item in issuedItems)
                        {
                            worksheet.Cell(row, 1).Value = item.PassType ?? "";
                            worksheet.Cell(row, 2).Value = item.Building ?? "";
                            worksheet.Cell(row, 3).Value = item.Floor ?? "";
                            worksheet.Cell(row, 4).Value = item.Line ?? "";
                            worksheet.Cell(row, 5).Value = item.StoreNumber ?? "";
                            worksheet.Cell(row, 6).Value = item.ContractorId;
                            worksheet.Cell(row, 7).Value = item.FullName ?? "";
                            worksheet.Cell(row, 8).Value = item.Position ?? "";
                            worksheet.Cell(row, 9).Value = item.Citizenship ?? "";
                            worksheet.Cell(row, 10).Value = item.Nationality ?? "";
                            worksheet.Cell(row, 11).Value = item.StartDate?.ToString("dd.MM.yyyy") ?? "";
                            worksheet.Cell(row, 12).Value = item.EndDate?.ToString("dd.MM.yyyy") ?? "";
                            worksheet.Cell(row, 13).Value = item.Status ?? "";
                            worksheet.Cell(row, 14).Value = item.Phone ?? "";
                            worksheet.Cell(row, 15).Value = item.ProductType ?? "";
                            row++;
                        }
                        break;

                    case "expiring-passes":
                        var expiringData = await GetExpiringPassesReportData(startDate!.Value, endDate!.Value, disablePagination: true);
                        if (!(expiringData is OkObjectResult expiringOkResult))
                        {
                            Console.WriteLine($"Error: Expiring passes report data returned non-OK result: {expiringData}");
                            return StatusCode(500, "Failed to retrieve expiring passes report data");
                        }
                        var expiringResult = expiringOkResult.Value as dynamic;
                        if (expiringResult == null || expiringResult.Data == null)
                        {
                            Console.WriteLine("Error: Expiring passes report data or Data property is null");
                            return StatusCode(500, "Expiring passes report data is empty");
                        }
                        var expiringItems = expiringResult.Data as IEnumerable<dynamic>;
                        if (expiringItems == null)
                        {
                            Console.WriteLine("Error: Expiring passes report items are null");
                            return StatusCode(500, "Expiring passes report items are empty");
                        }
                        Console.WriteLine($"Expiring passes items count: {expiringItems.Count()}");
                        worksheet.Cell(row, 1).Value = "Тип пропуска";
                        worksheet.Cell(row, 2).Value = "Дата окончания";
                        worksheet.Cell(row, 3).Value = "Здание";
                        worksheet.Cell(row, 4).Value = "Этаж";
                        worksheet.Cell(row, 5).Value = "Линия";
                        worksheet.Cell(row, 6).Value = "Торговая точка";
                        worksheet.Cell(row, 7).Value = "Код контрагента";
                        worksheet.Cell(row, 8).Value = "ФИО";
                        worksheet.Cell(row, 9).Value = "Должность";
                        worksheet.Cell(row, 10).Value = "Примечание";
                        row++;
                        foreach (var item in expiringItems)
                        {
                            worksheet.Cell(row, 1).Value = item.PassType ?? "";
                            worksheet.Cell(row, 2).Value = item.EndDate?.ToString("dd.MM.yyyy") ?? "";
                            worksheet.Cell(row, 3).Value = item.Building ?? "";
                            worksheet.Cell(row, 4).Value = item.Floor ?? "";
                            worksheet.Cell(row, 5).Value = item.Line ?? "";
                            worksheet.Cell(row, 6).Value = item.StoreNumber ?? "";
                            worksheet.Cell(row, 7).Value = item.ContractorId;
                            worksheet.Cell(row, 8).Value = item.FullName ?? "";
                            worksheet.Cell(row, 9).Value = item.Position ?? "";
                            worksheet.Cell(row, 10).Value = item.Note ?? "";
                            row++;
                        }
                        break;

                    case "active-passes":
                        var activeData = await GetActivePassesReportData(passType, building, floor, line, disablePagination: true);
                        if (!(activeData is OkObjectResult activeOkResult))
                        {
                            Console.WriteLine($"Error: Active passes report data returned non-OK result: {activeData}");
                            return StatusCode(500, "Failed to retrieve active passes report data");
                        }
                        var activeResult = activeOkResult.Value as dynamic;
                        if (activeResult == null || activeResult.Data == null)
                        {
                            Console.WriteLine("Error: Active passes report data or Data property is null");
                            return StatusCode(500, "Active passes report data is empty");
                        }
                        var activeItems = activeResult.Data as IEnumerable<dynamic>;
                        if (activeItems == null)
                        {
                            Console.WriteLine("Error: Active passes report items are null");
                            return StatusCode(500, "Active passes report items are empty");
                        }
                        Console.WriteLine($"Active passes items count: {activeItems.Count()}");
                        worksheet.Cell(row, 1).Value = "№ п/п";
                        worksheet.Cell(row, 2).Value = "Тип пропуска";
                        worksheet.Cell(row, 3).Value = "Здание";
                        worksheet.Cell(row, 4).Value = "Этаж";
                        worksheet.Cell(row, 5).Value = "Линия";
                        worksheet.Cell(row, 6).Value = "Торговая точка";
                        worksheet.Cell(row, 7).Value = "Код контрагента";
                        worksheet.Cell(row, 8).Value = "ФИО";
                        worksheet.Cell(row, 9).Value = "Должность";
                        worksheet.Cell(row, 10).Value = "Дата начала";
                        worksheet.Cell(row, 11).Value = "Дата окончания";
                        worksheet.Cell(row, 12).Value = "Номер пропуска";
                        worksheet.Cell(row, 13).Value = "Гражданство";
                        worksheet.Cell(row, 14).Value = "Национальность";
                        worksheet.Cell(row, 15).Value = "Телефон";
                        worksheet.Cell(row, 16).Value = "Тип документа";
                        worksheet.Cell(row, 17).Value = "Серия и номер паспорта";
                        worksheet.Cell(row, 18).Value = "Кем выдан";
                        worksheet.Cell(row, 19).Value = "Дата выдачи паспорта";
                        worksheet.Cell(row, 20).Value = "Группа товаров";
                        worksheet.Cell(row, 21).Value = "Дата рождения";
                        row++;
                        int index = 1;
                        foreach (var item in activeItems)
                        {
                            worksheet.Cell(row, 1).Value = index++;
                            worksheet.Cell(row, 2).Value = item.PassType ?? "";
                            worksheet.Cell(row, 3).Value = item.Building ?? "";
                            worksheet.Cell(row, 4).Value = item.Floor ?? "";
                            worksheet.Cell(row, 5).Value = item.Line ?? "";
                            worksheet.Cell(row, 6).Value = item.StoreNumber ?? "";
                            worksheet.Cell(row, 7).Value = item.ContractorId;
                            worksheet.Cell(row, 8).Value = item.FullName ?? "";
                            worksheet.Cell(row, 9).Value = item.Position ?? "";
                            worksheet.Cell(row, 10).Value = item.StartDate?.ToString("dd.MM.yyyy") ?? "";
                            worksheet.Cell(row, 11).Value = item.EndDate?.ToString("dd.MM.yyyy") ?? "";
                            worksheet.Cell(row, 12).Value = item.PassNumber ?? "";
                            worksheet.Cell(row, 13).Value = item.Citizenship ?? "";
                            worksheet.Cell(row, 14).Value = item.Nationality ?? "";
                            worksheet.Cell(row, 15).Value = item.Phone ?? "";
                            worksheet.Cell(row, 16).Value = item.DocumentType ?? "";
                            worksheet.Cell(row, 17).Value = item.PassportSerialNumber ?? "";
                            worksheet.Cell(row, 18).Value = item.PassportIssuedBy ?? "";
                            worksheet.Cell(row, 19).Value = item.PassportIssueDate?.ToString("dd.MM.yyyy") ?? "";
                            worksheet.Cell(row, 20).Value = item.ProductType ?? "";
                            worksheet.Cell(row, 21).Value = item.BirthDate?.ToString("dd.MM.yyyy") ?? "";
                            row++;
                        }
                        break;

                    default:
                        return BadRequest("Неизвестный тип отчёта");
                }

                worksheet.Columns().AdjustToContents();
                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    stream.Position = 0;
                    var fileName = $"{reportType}-report_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                    return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
                }
            }
        }
    }
}