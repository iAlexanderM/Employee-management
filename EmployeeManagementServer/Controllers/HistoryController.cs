using AutoMapper;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EmployeeManagementServer.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class HistoryController : ControllerBase
    {
        private readonly IHistoryService _historyService;
        private readonly IMapper _mapper;
        private readonly ILogger<HistoryController> _logger;
        private readonly ApplicationDbContext _context;

        public HistoryController(IHistoryService historyService, IMapper mapper, ILogger<HistoryController> logger, ApplicationDbContext context)
        {
            _historyService = historyService;
            _mapper = mapper;
            _logger = logger;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetHistory([FromQuery] string entityType, [FromQuery] string entityId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(entityType) || string.IsNullOrWhiteSpace(entityId))
                {
                    return BadRequest("EntityType and EntityId query parameters are required.");
                }

                var historyEntries = await _historyService.GetHistoryAsync(entityType, entityId);
                var historyDtoList = _mapper.Map<IEnumerable<HistoryDto>>(historyEntries);

                if (!historyDtoList.Any())
                {
                    _logger.LogInformation("No history found for EntityType: {EntityType}, EntityId: {EntityId}", entityType, entityId);
                }

                var response = new
                {
                    GeneralHistory = historyDtoList
                };

                _logger.LogInformation("Retrieved {Count} history entries for EntityType: {EntityType}, EntityId: {EntityId}",
                                       historyDtoList.Count(), entityType, entityId);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving history for EntityType: {EntityType}, EntityId: {EntityId}", entityType, entityId);
                return StatusCode(500, "Server error while retrieving history.");
            }
        }

        [HttpPost]
        public async Task<IActionResult> LogHistory([FromBody] HistoryDto historyDto)
        {
            try
            {
                if (historyDto == null || string.IsNullOrWhiteSpace(historyDto.EntityType) ||
                    string.IsNullOrWhiteSpace(historyDto.EntityId) || string.IsNullOrWhiteSpace(historyDto.Action))
                {
                    _logger.LogWarning("Invalid history log data received: {@HistoryDto}", historyDto);
                    return BadRequest("Invalid history log data. EntityType, EntityId, and Action are required.");
                }

                var history = _mapper.Map<History>(historyDto);
                history.ChangedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown"; // Используем UUID
                history.ChangedAt = DateTime.UtcNow;

                await _historyService.LogHistoryAsync(history);

                _logger.LogInformation("History logged successfully for EntityType: {EntityType}, EntityId: {EntityId}, Action: {Action}",
                                       history.EntityType, history.EntityId, history.Action);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging history for DTO: {@HistoryDto}", historyDto);
                return StatusCode(500, "Server error while logging history.");
            }
        }
    }
}