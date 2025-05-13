using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Data;
using Microsoft.Extensions.Logging;
using System.Linq;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Services
{
    public class ContractorSearchService : IContractorSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ContractorSearchService> _logger;

        public ContractorSearchService(ApplicationDbContext context, ILogger<ContractorSearchService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Contractor>> SearchContractorsAsync(ContractorSearchDto searchDto)
        {
            var query = _context.Contractors
                .Include(c => c.Photos)
                .AsQueryable();

            query = ApplyFilters(query, searchDto);

            return await query.ToListAsync();
        }

        private IQueryable<Contractor> ApplyFilters(IQueryable<Contractor> query, ContractorSearchDto searchDto)
        {
            if (searchDto.Id.HasValue)
            {
                query = query.Where(c => c.Id == searchDto.Id.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.FirstName))
            {
                query = query.Where(c => EF.Functions.ILike(c.FirstName.Trim(), $"%{searchDto.FirstName.Trim()}%"));
            }

            if (!string.IsNullOrEmpty(searchDto.LastName))
            {
                query = query.Where(c => EF.Functions.ILike(c.LastName.Trim(), $"%{searchDto.LastName.Trim()}%"));
            }

            if (!string.IsNullOrEmpty(searchDto.MiddleName))
            {
                query = query.Where(c => EF.Functions.ILike(c.MiddleName.Trim(), $"%{searchDto.MiddleName.Trim()}%"));
            }

            if (searchDto.BirthDate.HasValue)
            {
                query = query.Where(c => c.BirthDate == searchDto.BirthDate.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.PassportSerialNumber))
            {
                query = query.Where(c => EF.Functions.ILike(c.PassportSerialNumber.Trim(), $"%{searchDto.PassportSerialNumber.Trim()}%"));
            }

            if (!string.IsNullOrEmpty(searchDto.PassportIssuedBy))
            {
                query = query.Where(c => EF.Functions.ILike(c.PassportIssuedBy.Trim(), $"%{searchDto.PassportIssuedBy.Trim()}%"));
            }

            if (searchDto.PassportIssueDate.HasValue)
            {
                query = query.Where(c => c.PassportIssueDate == searchDto.PassportIssueDate.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.PhoneNumber))
            {
                query = query.Where(c => EF.Functions.ILike(c.PhoneNumber.Trim(), $"%{searchDto.PhoneNumber.Trim()}%"));
            }

            if (!string.IsNullOrEmpty(searchDto.ProductType))
            {
                query = query.Where(c => EF.Functions.ILike(c.ProductType.Trim(), $"%{searchDto.ProductType.Trim()}%"));
            }

            // Фильтрация по IsArchived (по умолчанию false, если не указано)
            if (searchDto.IsArchived.HasValue)
            {
                query = query.Where(c => c.IsArchived == searchDto.IsArchived.Value);
            }
            else
            {
                query = query.Where(c => !c.IsArchived);
            }

            return query;
        }
    }
}