using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Data;

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
        public async Task<IActionResult> GetContractors([FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] bool includeArchived = false)
        {
            try
            {
                if (page < 1 || pageSize < 1)
                {
                    return BadRequest("Параметры страницы и размера должны быть больше нуля.");
                }

                int skip = (page - 1) * pageSize;
                int total = await _contractorService.GetTotalContractorsCountAsync(includeArchived);
                var contractors = await _contractorService.GetContractorsAsync(skip, pageSize, includeArchived);

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
                        cost = p.PassType?.Cost,
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
                    }).ToList(),
                History = contractor.History.Select(h => new
                {
                    h.Id,
                    h.FieldName,
                    h.OldValue,
                    h.NewValue,
                    h.ChangedAt,
                    h.ChangedBy
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

            await _contractorService.CreateContractorAsync(contractor);
            _logger.LogInformation($"Контрагент с ID {contractor.Id} успешно создан.");
            return Ok(contractor);
        }

        [HttpPut("edit/{id}")]
        public async Task<IActionResult> UpdateContractor(int id, [FromForm] ContractorDto contractorDto)
        {
            _logger.LogInformation("Начало обновления контрагента с ID {Id}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Некорректные данные для обновления контрагента с ID {Id}: {@ModelState}", id, ModelState);
                return BadRequest(ModelState);
            }

            var contractor = await _contractorService.GetContractorByIdAsync(id);
            if (contractor == null)
            {
                _logger.LogWarning("Контрагент с ID {Id} не найден.", id);
                return NotFound($"Контрагент с ID {id} не найден.");
            }

            if (contractor.PassportSerialNumber != contractorDto.PassportSerialNumber)
            {
                var existingContractor = await _contractorService.FindContractorByPassportSerialNumberAsync(contractorDto.PassportSerialNumber);
                if (existingContractor != null && existingContractor.Id != id)
                {
                    _logger.LogWarning("Контрагент с таким номером паспорта уже существует: {PassportSerialNumber}", contractorDto.PassportSerialNumber);
                    return BadRequest("Контрагент с таким номером паспорта уже существует.");
                }
            }

            _logger.LogInformation("Контрагент с ID {Id} найден, обновление данных началось.", id);

            try
            {
                var changedBy = User.Identity.Name ?? "Unknown";
                await LogContractorChanges(contractor, contractorDto, changedBy);

                UpdateContractorDetails(contractor, contractorDto);

                var allPhotosToRemove = contractorDto.PhotosToRemove
                    .Concat(contractorDto.DocumentPhotosToRemove ?? new List<int>())
                    .ToList();

                await _contractorService.UpdateContractorAsync(
                    contractor,
                    contractorDto.Photos,
                    contractorDto.DocumentPhotos,
                    allPhotosToRemove
                );

                _logger.LogInformation("Изменения контрагента с ID {Id} успешно сохранены в базе данных.", id);
                return Ok(contractor);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении контрагента с ID {Id}.", id);
                return StatusCode(500, "Произошла ошибка при обновлении контрагента.");
            }
        }

        [HttpPut("archive/{id}")]
        public async Task<IActionResult> ArchiveContractor(int id)
        {
            try
            {
                var changedBy = User.Identity.Name ?? "Unknown";
                var success = await _contractorService.ArchiveContractorAsync(id, changedBy);
                if (!success)
                {
                    return NotFound("Контрагент не найден.");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Ошибка при архивировании контрагента с ID {Id}", id);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при архивировании контрагента с ID {Id}", id);
                return StatusCode(500, "Произошла ошибка при архивировании контрагента.");
            }
        }

        [HttpPut("unarchive/{id}")]
        public async Task<IActionResult> UnarchiveContractor(int id)
        {
            try
            {
                var changedBy = User.Identity.Name ?? "Unknown";
                var success = await _contractorService.UnarchiveContractorAsync(id, changedBy);
                if (!success)
                {
                    return NotFound("Контрагент не найден или не заархивирован.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при разархивировании контрагента с ID {Id}", id);
                return StatusCode(500, "Произошла ошибка при разархивировании контрагента.");
            }
        }

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetContractorHistory(int id)
        {
            try
            {
                var history = await _contractorService.GetContractorHistoryAsync(id);
                if (!history.Any())
                {
                    return NotFound("История изменений для контрагента не найдена.");
                }

                var historyDtos = _mapper.Map<List<ContractorHistoryDto>>(history);
                return Ok(historyDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении истории изменений для контрагента с ID {Id}", id);
                return StatusCode(500, "Ошибка сервера.");
            }
        }

        private async Task LogContractorChanges(Contractor contractor, ContractorDto contractorDto, string changedBy)
        {
            if (contractor.FirstName != contractorDto.FirstName)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "FirstName", contractor.FirstName, contractorDto.FirstName, changedBy);

            if (contractor.LastName != contractorDto.LastName)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "LastName", contractor.LastName, contractorDto.LastName, changedBy);

            if (contractor.MiddleName != contractorDto.MiddleName)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "MiddleName", contractor.MiddleName, contractorDto.MiddleName, changedBy);

            if (contractor.BirthDate != contractorDto.BirthDate)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "BirthDate", contractor.BirthDate.ToString(), contractorDto.BirthDate.ToString(), changedBy);

            if (contractor.DocumentType != contractorDto.DocumentType)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "DocumentType", contractor.DocumentType, contractorDto.DocumentType, changedBy);

            if (contractor.PassportSerialNumber != contractorDto.PassportSerialNumber)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "PassportSerialNumber", contractor.PassportSerialNumber, contractorDto.PassportSerialNumber, changedBy);

            if (contractor.PassportIssuedBy != contractorDto.PassportIssuedBy)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "PassportIssuedBy", contractor.PassportIssuedBy, contractorDto.PassportIssuedBy, changedBy);

            if (contractor.PassportIssueDate != contractorDto.PassportIssueDate)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "PassportIssueDate", contractor.PassportIssueDate.ToString(), contractorDto.PassportIssueDate.ToString(), changedBy);

            if (contractor.Citizenship != contractorDto.Citizenship)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "Citizenship", contractor.Citizenship, contractorDto.Citizenship, changedBy);

            if (contractor.Nationality != contractorDto.Nationality)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "Nationality", contractor.Nationality, contractorDto.Nationality, changedBy);

            if (contractor.ProductType != contractorDto.ProductType)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "ProductType", contractor.ProductType, contractorDto.ProductType, changedBy);

            if (contractor.PhoneNumber != contractorDto.PhoneNumber)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "PhoneNumber", contractor.PhoneNumber, contractorDto.PhoneNumber, changedBy);

            if (contractor.IsArchived != contractorDto.IsArchived)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "IsArchived", contractor.IsArchived.ToString(), contractorDto.IsArchived.ToString(), changedBy);

            if (contractor.SortOrder != contractorDto.SortOrder)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "SortOrder", contractor.SortOrder?.ToString() ?? "null", contractorDto.SortOrder?.ToString() ?? "null", changedBy);

            if (contractor.Note != contractorDto.Note)
                await _contractorService.LogContractorChangeAsync(contractor.Id, "Note", contractor.Note ?? "null", contractorDto.Note ?? "null", changedBy);
        }

        private void UpdateContractorDetails(Contractor contractor, ContractorDto contractorDto)
        {
            contractor.FirstName = contractorDto.FirstName;
            contractor.LastName = contractorDto.LastName;
            contractor.MiddleName = contractorDto.MiddleName;
            contractor.BirthDate = contractorDto.BirthDate;
            contractor.DocumentType = contractorDto.DocumentType;
            contractor.PassportSerialNumber = contractorDto.PassportSerialNumber;
            contractor.PassportIssuedBy = contractorDto.PassportIssuedBy;
            contractor.PassportIssueDate = contractorDto.PassportIssueDate;
            contractor.Citizenship = contractorDto.Citizenship;
            contractor.Nationality = contractorDto.Nationality;
            contractor.ProductType = contractorDto.ProductType;
            contractor.PhoneNumber = contractorDto.PhoneNumber;
            contractor.IsArchived = contractorDto.IsArchived;
            contractor.SortOrder = contractorDto.SortOrder;
            contractor.Note = contractorDto.Note;
        }
    }
}