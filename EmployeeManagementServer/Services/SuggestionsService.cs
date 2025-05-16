using EmployeeManagementServer.Data;
using EmployeeManagementServer.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

public class SuggestionsService : ISuggestionsService
{
    private readonly ApplicationDbContext _context;

    public SuggestionsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public IEnumerable<string> GetBuildingSuggestions(string query, bool? isArchived = null)
    {
        string pattern = string.IsNullOrEmpty(query) ? "%" : $"{query.Trim()}%";
        var queryable = _context.Buildings.AsQueryable();

        if (isArchived.HasValue)
        {
            queryable = queryable.Where(b => b.IsArchived == isArchived.Value);
        }

        return queryable
            .Where(b => EF.Functions.ILike(b.Name, pattern))
            .Select(b => b.Name)
            .Distinct()
            .OrderBy(s => s)
            .ToList();
    }

    public IEnumerable<string> GetFloorSuggestions(string query, bool? isArchived = null)
    {
        string pattern = string.IsNullOrEmpty(query) ? "%" : $"{query.Trim()}%";
        var queryable = _context.Floors.AsQueryable();

        if (isArchived.HasValue)
        {
            queryable = queryable.Where(f => f.IsArchived == isArchived.Value);
        }

        return queryable
            .Where(f => EF.Functions.ILike(f.Name, pattern))
            .Select(f => f.Name)
            .Distinct()
            .OrderBy(s => s)
            .ToList();
    }

    public IEnumerable<string> GetLineSuggestions(string query, bool? isArchived = null)
    {
        string pattern = string.IsNullOrEmpty(query) ? "%" : $"{query.Trim()}%";
        var queryable = _context.Lines.AsQueryable();

        if (isArchived.HasValue)
        {
            queryable = queryable.Where(l => l.IsArchived == isArchived.Value);
        }

        return queryable
            .Where(l => EF.Functions.ILike(l.Name, pattern))
            .Select(l => l.Name)
            .Distinct()
            .OrderBy(s => s)
            .ToList();
    }

    public IEnumerable<string> GetStoreNumberSuggestions(string query, bool? isArchived = null)
    {
        string pattern = string.IsNullOrEmpty(query) ? "%" : $"{query.Trim()}%";
        var queryable = _context.StoreNumbers.AsQueryable();

        if (isArchived.HasValue)
        {
            queryable = queryable.Where(sn => sn.IsArchived == isArchived.Value);
        }

        return queryable
            .Where(sn => EF.Functions.ILike(sn.Name, pattern))
            .Select(sn => sn.Name)
            .Distinct()
            .OrderBy(s => s)
            .ToList();
    }
}