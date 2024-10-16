using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;

namespace EmployeeManagementServer.Services
{
    public class ContractorSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ContractorSearchService> _logger;

        public ContractorSearchService(ApplicationDbContext context, ILogger<ContractorSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Contractor>> SearchContractorsAsync(
            int? id,
            string? firstName,
            string? lastName,
            string? middleName,
            DateTime? birthDate,
            string? documentType,
            string? passportSerialNumber,
            string? passportIssuedBy,
            DateTime? passportIssueDate,
            string? productType,
            string? citizenship,
            string? nationality,
            string? phoneNumber)
        {
            _logger.LogInformation("Начало поиска контрагентов с заданными параметрами");

            // Обрезаем пробелы и приводим к общему виду
            firstName = firstName?.Trim();
            lastName = lastName?.Trim();
            middleName = middleName?.Trim();
            documentType = documentType?.Trim();
            passportSerialNumber = passportSerialNumber?.Trim();
            passportIssuedBy = passportIssuedBy?.Trim();
            productType = productType?.Trim();
            citizenship = citizenship?.Trim();
            nationality = nationality?.Trim();
            phoneNumber = phoneNumber?.Trim();

            var query = _context.Contractors
                .Include(c => c.Photos) // Загрузка связанных фотографий
                .AsQueryable();

            if (id.HasValue)
            {
                query = query.Where(c => c.Id == id.Value);
            }

            if (!string.IsNullOrEmpty(firstName))
            {
                query = query.Where(c => EF.Functions.ILike(c.FirstName, $"%{firstName}%"));
            }

            if (!string.IsNullOrEmpty(lastName))
            {
                query = query.Where(c => EF.Functions.ILike(c.LastName, $"%{lastName}%"));
            }

            if (!string.IsNullOrEmpty(middleName))
            {
                query = query.Where(c => EF.Functions.ILike(c.MiddleName, $"%{middleName}%"));
            }

            if (birthDate.HasValue)
            {
                query = query.Where(c => c.BirthDate == birthDate.Value);
            }

            if (!string.IsNullOrEmpty(documentType))
            {
                query = query.Where(c => EF.Functions.ILike(c.DocumentType, $"%{documentType}%"));
            }

            if (!string.IsNullOrEmpty(passportSerialNumber))
            {
                query = query.Where(c => EF.Functions.ILike(c.PassportSerialNumber, $"%{passportSerialNumber}%"));
            }

            if (!string.IsNullOrEmpty(passportIssuedBy))
            {
                query = query.Where(c => EF.Functions.ILike(c.PassportIssuedBy, $"%{passportIssuedBy}%"));
            }

            if (passportIssueDate.HasValue)
            {
                query = query.Where(c => c.PassportIssueDate == passportIssueDate.Value);
            }

            if (!string.IsNullOrEmpty(productType))
            {
                query = query.Where(c => EF.Functions.ILike(c.ProductType, $"%{productType}%"));
            }

            if (!string.IsNullOrEmpty(phoneNumber))
            {
                query = query.Where(c => EF.Functions.ILike(c.PhoneNumber, $"%{phoneNumber}%"));
            }

            if (!string.IsNullOrEmpty(citizenship))
            {
                query = query.Where(c => EF.Functions.ILike(c.Citizenship, $"%{citizenship}%"));
            }

            if (!string.IsNullOrEmpty(nationality))
            {
                query = query.Where(c => EF.Functions.ILike(c.Nationality, $"%{nationality}%"));
            }

            // Выполнение безопасного запроса и получение результатов
            var result = await query.ToListAsync();
            _logger.LogInformation("Поиск завершён. Найдено контрагентов: {count}", result.Count);

            return result;
        }
    }
}
