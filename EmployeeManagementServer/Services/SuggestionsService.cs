using EmployeeManagementServer.Data;

public class SuggestionsService : ISuggestionsService
{
    private readonly ApplicationDbContext _context;

    public SuggestionsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public IEnumerable<string> GetBuildingSuggestions(string query)
    {
        return GetSuggestions(_context.Stores.Select(s => s.Building), query);
    }

    public IEnumerable<string> GetFloorSuggestions(string query)
    {
        return GetSuggestions(_context.Stores.Select(s => s.Floor), query);
    }

    public IEnumerable<string> GetLineSuggestions(string query)
    {
        return GetSuggestions(_context.Stores.Select(s => s.Line), query);
    }

    public IEnumerable<string> GetStoreNumberSuggestions(string query)
    {
        return GetSuggestions(_context.Stores.Select(s => s.StoreNumber), query);
    }

    private IEnumerable<string> GetSuggestions(IQueryable<string> source, string query)
    {
        return source
            .Where(s => string.IsNullOrEmpty(query) || s.StartsWith(query))
            .Distinct()
            .OrderBy(s => s)
            .ToList();
    }
}
