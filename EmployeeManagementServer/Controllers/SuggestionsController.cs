using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("api/suggestions")]
public class SuggestionsController : ControllerBase
{
    private readonly ISuggestionsService _suggestionsService;

    public SuggestionsController(ISuggestionsService suggestionsService)
    {
        _suggestionsService = suggestionsService;
    }

    [HttpGet("buildings")]
    public IActionResult GetBuildingSuggestions([FromQuery] string? query)
    {
        var suggestions = _suggestionsService.GetBuildingSuggestions(query ?? string.Empty);
        return Ok(suggestions);
    }

    [HttpGet("floors")]
    public IActionResult GetFloorSuggestions([FromQuery] string? query)
    {
        var suggestions = _suggestionsService.GetFloorSuggestions(query ?? string.Empty);
        return Ok(suggestions);
    }

    [HttpGet("lines")]
    public IActionResult GetLineSuggestions([FromQuery] string? query)
    {
        var suggestions = _suggestionsService.GetLineSuggestions(query ?? string.Empty);
        return Ok(suggestions);
    }

    [HttpGet("storeNumbers")]
    public IActionResult GetStoreNumberSuggestions([FromQuery] string? query)
    {
        var suggestions = _suggestionsService.GetStoreNumberSuggestions(query ?? string.Empty);
        return Ok(suggestions);
    }

    [HttpGet("stores")]
    public IActionResult GetStoresSuggestions([FromQuery] string? query)
    {
        var suggestions = _suggestionsService.GetStoresSuggestions(query ?? string.Empty);
        return Ok(suggestions);
    }

    [HttpGet("contractors")]
    public IActionResult GetContractorSuggestions([FromQuery] string? query)
    {
        var suggestions = _suggestionsService.GetContractorSuggestions(query ?? string.Empty);
        return Ok(suggestions);
    }
}
