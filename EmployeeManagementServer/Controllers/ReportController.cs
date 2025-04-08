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

        [HttpGet("financial")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetFinancialReport(DateTime startDate, DateTime endDate)
            => await GenerateExcel("financial", startDate, endDate);

        [HttpGet("financial-data")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetFinancialReportData(DateTime startDate, DateTime endDate)
        {
            var searchDto = new PassTransactionSearchDto { CreatedAfter = startDate, CreatedBefore = endDate };
            var (totalCount, transactions) = await _passTransactionSearchService.SearchPassTransactionsAsync(searchDto, 0, int.MaxValue);
            var groupedData = transactions
                .GroupBy(t => t.TokenType == "Р" ? "Пропуск" : t.TokenType)
                .Select(g => new
                {
                    TokenType = g.Key,
                    PaidAmount = g.Where(t => t.Status == "Оплачено").Sum(t => t.Amount),
                    TransactionCount = g.Count()
                });
            return Ok(groupedData);
        }

        [HttpGet("passes-summary")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetPassesSummaryReport(DateTime startDate, DateTime endDate)
    => await GenerateExcel("passes-summary", startDate, endDate);

        [HttpGet("passes-summary-details")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> GetPassesSummaryDetails(string queueType, DateTime startDate, DateTime endDate)
        {
            var query = from pt in _context.PassTransactions
                        join qt in _context.QueueTokens on pt.Token equals qt.Token into queueTokens
                        from qt in queueTokens.DefaultIfEmpty()
                        where pt.CreatedAt >= startDate && pt.CreatedAt <= endDate
                        select new { PassTransaction = pt, QueueToken = qt };

            var passTransactionsWithQueue = await query.ToListAsync();
            var transactionIds = passTransactionsWithQueue.Select(ptq => ptq.PassTransaction.Id).ToList();

            var passes = await _context.Passes
              .Include(p => p.PassType)
              .Where(p => transactionIds.Contains(p.PassTransactionId))
              .ToListAsync();

            var effectiveQueueType = queueType == "Пропуск" ? "P" : queueType;
            var details = passes
              .Where(p => (passTransactionsWithQueue.FirstOrDefault(ptq => ptq.PassTransaction.Id == p.PassTransactionId)?.QueueToken?.TokenType ?? "Неизвестно") == effectiveQueueType)
              .GroupBy(p => p.PassType.Name)
              .Select(g => new
              {
                  PassType = g.Key,
                  Amount = g.Sum(p => p.PassType.Cost),
                  Count = g.Count()
              })
              .ToList();

            return Ok(details);
        }

        [HttpGet("passes-summary-data")]
        public async Task<IActionResult> GetPassesSummaryReportData(DateTime startDate, DateTime endDate)
        {
            var query = from pt in _context.PassTransactions
                        join qt in _context.QueueTokens on pt.Token equals qt.Token into queueTokens
                        from qt in queueTokens.DefaultIfEmpty()
                        where pt.CreatedAt >= startDate && pt.CreatedAt <= endDate
                        select new { PassTransaction = pt, QueueToken = qt };

            var passTransactionsWithQueue = await query.ToListAsync();
            var transactionIds = passTransactionsWithQueue.Select(ptq => ptq.PassTransaction.Id).ToList();

            var passes = await _context.Passes
                .Include(p => p.PassType)
                .Where(p => transactionIds.Contains(p.PassTransactionId))
                .ToListAsync();

            var groupedData = passes
                .GroupBy(p => passTransactionsWithQueue.FirstOrDefault(ptq => ptq.PassTransaction.Id == p.PassTransactionId)?.QueueToken?.TokenType ?? "Неизвестно")
                .Select(g => new
                {
                    QueueType = g.Key == "P" ? "Пропуск" : g.Key,
                    TotalAmount = g.Sum(p => p.PassType.Cost),
                    PassCount = g.Count()
                })
                .ToList();

            return Ok(groupedData);
        }

        [HttpGet("issued-passes")]
        public async Task<IActionResult> GetIssuedPassesReport(DateTime startDate, DateTime endDate, string? building = null, string? floor = null, string? line = null, string? passType = null)
            => await GenerateExcel("issued-passes", startDate, endDate, building, floor, line, null, passType);

        [HttpGet("issued-passes-data")]
        public async Task<IActionResult> GetIssuedPassesReportData(DateTime startDate, DateTime endDate, string? building = null, string? floor = null, string? line = null, string? passType = null)
        {
            var query = _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Store)
                .Include(p => p.Contractor)
                .Where(p => p.StartDate >= startDate && p.StartDate <= endDate);

            if (!string.IsNullOrEmpty(building)) query = query.Where(p => p.Store.Building == building);
            if (!string.IsNullOrEmpty(floor)) query = query.Where(p => p.Store.Floor == floor);
            if (!string.IsNullOrEmpty(line)) query = query.Where(p => p.Store.Line == line);
            if (!string.IsNullOrEmpty(passType)) query = query.Where(p => p.PassType.Name == passType);

            var passes = await query
                .Select(p => new
                {
                    PassType = p.PassType.Name,
                    Building = p.Store.Building,
                    Floor = p.Store.Floor,
                    Line = p.Store.Line,
                    StoreNumber = p.Store.StoreNumber,
                    ContractorId = p.ContractorId,
                    FullName = $"{p.Contractor.LastName} {p.Contractor.FirstName} {p.Contractor.MiddleName}",
                    Position = p.Position,
                    Citizenship = p.Contractor.Citizenship,
                    Nationality = p.Contractor.Nationality,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    Status = p.IsClosed ? "Closed" : "Active",
                    Phone = p.Contractor.PhoneNumber,
                    ProductType = p.Contractor.ProductType
                })
                .ToListAsync();
            return Ok(passes);
        }

        [HttpGet("expiring-passes")]
        public async Task<IActionResult> GetExpiringPassesReport(DateTime startDate, DateTime endDate)
            => await GenerateExcel("expiring-passes", startDate, endDate);

        [HttpGet("expiring-passes-data")]
        public async Task<IActionResult> GetExpiringPassesReportData(DateTime startDate, DateTime endDate)
        {
            var passes = await _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Store)
                .Include(p => p.Contractor)
                .Where(p => !p.IsClosed && p.EndDate >= startDate && p.EndDate <= endDate)
                .Select(p => new
                {
                    PassType = p.PassType.Name,
                    EndDate = p.EndDate,
                    Building = p.Store.Building,
                    Floor = p.Store.Floor,
                    Line = p.Store.Line,
                    StoreNumber = p.Store.StoreNumber,
                    ContractorId = p.ContractorId,
                    FullName = $"{p.Contractor.LastName} {p.Contractor.FirstName} {p.Contractor.MiddleName}",
                    Position = p.Position,
                    Note = p.Contractor.Note
                })
                .ToListAsync();
            return Ok(passes);
        }

        [HttpGet("active-passes")]
        public async Task<IActionResult> GetActivePassesReport(string? passType = null, string? building = null, string? floor = null, string? line = null)
            => await GenerateExcel("active-passes", null, null, building, floor, line, null, passType);

        [HttpGet("active-passes-data")]
        public async Task<IActionResult> GetActivePassesReportData(string? passType = null, string? building = null, string? floor = null, string? line = null)
        {
            var query = _context.Passes
                .Include(p => p.PassType)
                .Include(p => p.Store)
                .Include(p => p.Contractor)
                .Where(p => !p.IsClosed && p.EndDate > DateTime.UtcNow);

            if (!string.IsNullOrEmpty(passType)) query = query.Where(p => p.PassType.Name == passType);
            if (!string.IsNullOrEmpty(building)) query = query.Where(p => p.Store.Building == building);
            if (!string.IsNullOrEmpty(floor)) query = query.Where(p => p.Store.Floor == floor);
            if (!string.IsNullOrEmpty(line)) query = query.Where(p => p.Store.Line == line);

            var passes = await query
                .Select(p => new
                {
                    PassType = p.PassType.Name,
                    Building = p.Store.Building,
                    Floor = p.Store.Floor,
                    Line = p.Store.Line,
                    StoreNumber = p.Store.StoreNumber,
                    ContractorId = p.ContractorId,
                    FullName = $"{p.Contractor.LastName} {p.Contractor.FirstName} {p.Contractor.MiddleName}",
                    Position = p.Position,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    PassNumber = $"{p.StoreId}-{p.ContractorId}",
                    Citizenship = p.Contractor.Citizenship,
                    Nationality = p.Contractor.Nationality,
                    Phone = p.Contractor.PhoneNumber,
                    DocumentType = p.Contractor.DocumentType,
                    PassportSerialNumber = p.Contractor.PassportSerialNumber,
                    PassportIssuedBy = p.Contractor.PassportIssuedBy,
                    PassportIssueDate = p.Contractor.PassportIssueDate,
                    ProductType = p.Contractor.ProductType,
                    BirthDate = p.Contractor.BirthDate
                })
                .ToListAsync();
            return Ok(passes);
        }

        [HttpGet("suggestions/building")]
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

        [HttpGet("suggestions/pass-types")]
        public async Task<IActionResult> GetPassTypeSuggestions([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return Ok(new List<string>());
            var suggestions = await _context.PassTypes
                .Where(pt => EF.Functions.ILike(pt.Name, $"%{query}%"))
                .Select(pt => pt.Name)
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
                        var financialItems = ((OkObjectResult)financialData).Value as IEnumerable<dynamic>;
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
                        var summaryItems = ((OkObjectResult)summaryData).Value as IEnumerable<dynamic>;
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
                        var issuedData = await GetIssuedPassesReportData(startDate!.Value, endDate!.Value, building, floor, line, passType);
                        var issuedItems = ((OkObjectResult)issuedData).Value as IEnumerable<dynamic>;
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
                            worksheet.Cell(row, 11).Value = item.StartDate.ToString("dd.MM.yyyy");
                            worksheet.Cell(row, 12).Value = item.EndDate.ToString("dd.MM.yyyy");
                            worksheet.Cell(row, 13).Value = item.Status ?? "";
                            worksheet.Cell(row, 14).Value = item.Phone ?? "";
                            worksheet.Cell(row, 15).Value = item.ProductType ?? "";
                            row++;
                        }
                        break;

                    case "expiring-passes":
                        var expiringData = await GetExpiringPassesReportData(startDate!.Value, endDate!.Value);
                        var expiringItems = ((OkObjectResult)expiringData).Value as IEnumerable<dynamic>;
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
                            worksheet.Cell(row, 2).Value = item.EndDate.ToString("dd.MM.yyyy");
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
                        var activeData = await GetActivePassesReportData(passType, building, floor, line);
                        var activeItems = ((OkObjectResult)activeData).Value as IEnumerable<dynamic>;
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
                            worksheet.Cell(row, 10).Value = item.StartDate.ToString("dd.MM.yyyy");
                            worksheet.Cell(row, 11).Value = item.EndDate.ToString("dd.MM.yyyy");
                            worksheet.Cell(row, 12).Value = item.PassNumber ?? "";
                            worksheet.Cell(row, 13).Value = item.Citizenship ?? "";
                            worksheet.Cell(row, 14).Value = item.Nationality ?? "";
                            worksheet.Cell(row, 15).Value = item.Phone ?? "";
                            worksheet.Cell(row, 16).Value = item.DocumentType ?? "";
                            worksheet.Cell(row, 17).Value = item.PassportSerialNumber ?? "";
                            worksheet.Cell(row, 18).Value = item.PassportIssuedBy ?? "";
                            worksheet.Cell(row, 19).Value = item.PassportIssueDate.ToString("dd.MM.yyyy");
                            worksheet.Cell(row, 20).Value = item.ProductType ?? "";
                            worksheet.Cell(row, 21).Value = item.BirthDate.ToString("dd.MM.yyyy");
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