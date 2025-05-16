public interface ISuggestionsService
{
    IEnumerable<string> GetBuildingSuggestions(string query, bool? isArchived = null);
    IEnumerable<string> GetFloorSuggestions(string query, bool? isArchived = null);
    IEnumerable<string> GetLineSuggestions(string query, bool? isArchived = null);
    IEnumerable<string> GetStoreNumberSuggestions(string query, bool? isArchived = null);
}