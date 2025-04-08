using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;

public class SuggestionsService : ISuggestionsService
{
    private readonly ApplicationDbContext _context;

    public SuggestionsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public IEnumerable<string> GetBuildingSuggestions(string query)
    {
        string pattern = $"{query.Trim()}%";
        return _context.Stores
            .Where(s => string.IsNullOrEmpty(query) || EF.Functions.ILike(s.Building, pattern))
            .Select(s => s.Building)
            .Distinct()
            .OrderBy(s => s)
            .ToList();
    }

    public IEnumerable<string> GetFloorSuggestions(string query)
    {
        string pattern = $"{query.Trim()}%";
        return _context.Stores
            .Where(s => string.IsNullOrEmpty(query) || EF.Functions.ILike(s.Floor, pattern))
            .Select(s => s.Floor)
            .Distinct()
            .OrderBy(s => s)
            .ToList();
    }

    public IEnumerable<string> GetLineSuggestions(string query)
    {
        string pattern = $"{query.Trim()}%";
        return _context.Stores
            .Where(s => string.IsNullOrEmpty(query) || EF.Functions.ILike(s.Line, pattern))
            .Select(s => s.Line)
            .Distinct()
            .OrderBy(s => s)
            .ToList();
    }

    public IEnumerable<string> GetStoreNumberSuggestions(string query)
    {
        string pattern = $"{query.Trim()}%";
        return _context.Stores
            .Where(s => string.IsNullOrEmpty(query) || EF.Functions.ILike(s.StoreNumber, pattern))
            .Select(s => s.StoreNumber)
            .Distinct()
            .OrderBy(s => s)
            .ToList();
    }
}
