using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json;
using EmployeeManagementServer.Data;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ContractorsController : ControllerBase
    {
        private readonly ContractorService _contractorService;
        private readonly IMapper _mapper;
        private readonly ILogger<ContractorsController> _logger;
        private readonly ApplicationDbContext _context;

        public ContractorsController(
            ContractorService contractorService,
            IMapper mapper,
            ILogger<ContractorsController> logger,
            ApplicationDbContext context)
        {
            _contractorService = contractorService;
            _mapper = mapper;
            _logger = logger;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetContractors([FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] bool? isArchived = false)
        {
            try
            {
                if (page < 1 || pageSize < 1)
                {
                    return BadRequest("Параметры страницы и размера должны быть больше нуля.");
                }

                int skip = (page - 1) * pageSize;
                int total = await _contractorService.GetTotalContractorsCountAsync(isArchived);

                var contractors = await _contractorService.GetContractorsAsync(skip, pageSize, isArchived);

                var response = new
                {
                    total,
                    contractors = contractors.Select(c => new
                    {
                        c.Id,
                        c.FirstName,
                        c.LastName,
                        c.MiddleName,
                        c.Citizenship,
                        c.Nationality,
                        c.BirthDate,
                        c.DocumentType,
                        c.PassportSerialNumber,
                        c.PassportIssuedBy,
                        c.PassportIssueDate,
                        c.PhoneNumber,
                        c.ProductType,
                        c.IsArchived,
                        c.SortOrder,
                        c.CreatedAt,
                        c.Photos,
                        ActivePasses = c.Passes.Where(p => p.PassStatus == "Active").Select(p => new PassDetailsDto
                        {
                            Id = p.Id,
                            UniquePassId = p.UniquePassId,
                            PassTypeName = p.PassType?.Name ?? "Unknown",
                            StartDate = p.StartDate,
                            EndDate = p.EndDate,
                            ContractorName = $"{c.LastName} {c.FirstName} {c.MiddleName}",
                            IsClosed = p.IsClosed,
                            CloseReason = p.CloseReason,
                            PrintStatus = p.PrintStatus
                        }).ToList(),
                        ClosedPasses = c.Passes.Where(p => p.PassStatus == "Closed").Select(p => new PassDetailsDto
                        {
                            Id = p.Id,
                            UniquePassId = p.UniquePassId,
                            PassTypeName = p.PassType?.Name ?? "Unknown",
                            StartDate = p.StartDate,
                            EndDate = p.EndDate,
                            ContractorName = $"{c.LastName} {c.FirstName} {c.MiddleName}",
                            IsClosed = p.IsClosed,
                            CloseReason = p.CloseReason,
                            PrintStatus = p.PrintStatus
                        }).ToList()
                    }).ToList()
                };
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении контрагентов");
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetContractor(int id)
        {
            var contractor = await _contractorService.GetContractorByIdAsync(id);
            if (contractor == null)
            {
                return NotFound();
            }

            var response = new
            {
                contractor.Id,
                contractor.FirstName,
                contractor.LastName,
                contractor.MiddleName,
                contractor.Citizenship,
                contractor.Nationality,
                contractor.BirthDate,
                contractor.DocumentType,
                contractor.PassportSerialNumber,
                contractor.PassportIssuedBy,
                contractor.PassportIssueDate,
                contractor.PhoneNumber,
                contractor.ProductType,
                contractor.IsArchived,
                contractor.SortOrder,
                contractor.CreatedAt,
                contractor.Note,
                Photos = contractor.Photos.Select(p => new
                {
                    id = p.Id,
                    filePath = p.FilePath,
                    isDocumentPhoto = p.IsDocumentPhoto,
                    contractorId = p.ContractorId
                }).ToList(),
                Passes = contractor.Passes
                    .OrderByDescending(p => p.StartDate)
                    .Select(p => new
                    {
                        id = p.Id,
                        passTypeId = p.PassTypeId,
                        passTypeName = p.PassType?.Name ?? "Unknown",
                        cost = p.PassType.Cost,
                        contractorId = p.ContractorId,
                        storeId = p.StoreId,
                        position = p.Position,
                        startDate = p.StartDate,
                        endDate = p.EndDate,
                        transactionDate = p.TransactionDate,
                        isClosed = p.IsClosed,
                        passStatus = p.PassStatus,
                        printStatus = p.PrintStatus,
                        closeReason = p.CloseReason,
                        closeDate = p.CloseDate,
                        closedBy = p.ClosedBy
                    }).ToList()
            };

            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> CreateContractor([FromForm] ContractorDto contractorDto)
        {
            _logger.LogInformation("Данные, полученные с фронтенда: {@contractorDto}", contractorDto);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingContractor = await _contractorService.FindContractorByPassportSerialNumberAsync(contractorDto.PassportSerialNumber);
            if (existingContractor != null)
            {
                return BadRequest("Контрагент с таким номером паспорта уже существует.");
            }

            var contractor = _mapper.Map<Contractor>(contractorDto);

            if (contractorDto.Photos != null && contractorDto.Photos.Count > 0)
            {
                foreach (var photo in contractorDto.Photos)
                {
                    var photoPath = await _contractorService.SavePhotoAsync(photo, false);
                    contractor.Photos.Add(new ContractorPhoto
                    {
                        FilePath = photoPath,
                        IsDocumentPhoto = false
                    });
                }
            }

            if (contractorDto.DocumentPhotos != null && contractorDto.DocumentPhotos.Count > 0)
            {
                foreach (var docPhoto in contractorDto.DocumentPhotos)
                {
                    var docPhotoPath = await _contractorService.SavePhotoAsync(docPhoto, true);
                    contractor.Photos.Add(new ContractorPhoto
                    {
                        FilePath = docPhotoPath,
                        IsDocumentPhoto = true
                    });
                }
            }

            await _contractorService.CreateContractorAsync(contractor, User.Identity?.Name ?? "Unknown");
            _logger.LogInformation($"Контрагент с ID {contractor.Id} успешно создан.");
            return Ok(contractor);
        }

        // Замененный метод
        [HttpPut("edit/{id}")]
        public async Task<IActionResult> UpdateContractor(int id, [FromForm] ContractorDto contractorDto)
        {
            try
            {
                var contractor = _mapper.Map<Contractor>(contractorDto);
                contractor.Id = id;
                await _contractorService.UpdateContractorAsync(
                    contractor,
                    contractorDto.Photos,
                    contractorDto.DocumentPhotos,
                    contractorDto.PhotosToRemove.Concat(contractorDto.DocumentPhotosToRemove ?? new List<int>()).ToList(),
                    User.Identity?.Name ?? "Unknown");
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Замененный метод
        [HttpPut("{id}/archive")]
        public async Task<IActionResult> ArchiveContractor(int id)
        {
            try
            {
                await _contractorService.ArchiveContractorAsync(id, User.Identity?.Name ?? "Unknown");
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Замененный метод
        [HttpPut("{id}/unarchive")]
        public async Task<IActionResult> UnarchiveContractor(int id)
        {
            try
            {
                await _contractorService.UnarchiveContractorAsync(id, User.Identity?.Name ?? "Unknown");
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/note")]
        [Authorize]
        public async Task<IActionResult> UpdateNote(int id, [FromBody] UpdateNoteDto noteDto)
        {
            try
            {
                await _contractorService.UpdateNoteAsync(id, noteDto.Note, User.Identity?.Name);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Контрагент с ID {Id} не найден для обновления заметки.", id);
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Ошибка валидации заметки для контрагента с ID {Id}.", id);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении заметки для контрагента с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }
    }
}