public interface ISuggestionsService
{
    IEnumerable<string> GetBuildingSuggestions(string query);
    IEnumerable<string> GetFloorSuggestions(string query);
    IEnumerable<string> GetLineSuggestions(string query);
    IEnumerable<string> GetStoreNumberSuggestions(string query);
}
