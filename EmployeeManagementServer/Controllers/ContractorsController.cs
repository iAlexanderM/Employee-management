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

                var contractorDtos = _mapper.Map<List<ContractorResponseDto>>(contractors);

                var response = new
                {
                    total,
                    contractors = contractorDtos 
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
            var contractorResponseDto = _mapper.Map<ContractorResponseDto>(contractor);
            return Ok(contractorResponseDto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateContractor([FromForm] ContractorCreateDto contractorCreateDto) 
        {
            _logger.LogInformation("Данные, полученные с фронтенда: {@contractorCreateDto}", contractorCreateDto);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingContractor = await _contractorService.FindContractorByPassportSerialNumberAsync(contractorCreateDto.PassportSerialNumber);
            if (existingContractor != null)
            {
                return BadRequest("Контрагент с таким номером паспорта уже существует.");
            }

            var contractor = _mapper.Map<Contractor>(contractorCreateDto);

            if (contractorCreateDto.Photos != null && contractorCreateDto.Photos.Count > 0)
            {
                foreach (var photo in contractorCreateDto.Photos)
                {
                    var photoPath = await _contractorService.SavePhotoAsync(photo, false);
                    contractor.Photos.Add(new ContractorPhoto
                    {
                        FilePath = photoPath,
                        IsDocumentPhoto = false
                    });
                }
            }

            if (contractorCreateDto.DocumentPhotos != null && contractorCreateDto.DocumentPhotos.Count > 0)
            {
                foreach (var docPhoto in contractorCreateDto.DocumentPhotos)
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

            var createdContractorResponseDto = _mapper.Map<ContractorResponseDto>(contractor);
            return Ok(createdContractorResponseDto);
        }

        [HttpPut("edit/{id}")]
        public async Task<IActionResult> UpdateContractor(int id, [FromForm] ContractorUpdateDto contractorUpdateDto)
        {
            try
            {
                var existingContractor = await _contractorService.GetContractorByIdAsync(id);
                if (existingContractor == null)
                {
                    return NotFound($"Контрагент с ID {id} не найден.");
                }

                _mapper.Map(contractorUpdateDto, existingContractor);

                await _contractorService.UpdateContractorAsync(
                    existingContractor, 
                    contractorUpdateDto.Photos,
                    contractorUpdateDto.DocumentPhotos,
                    contractorUpdateDto.PhotosToRemove.Concat(contractorUpdateDto.DocumentPhotosToRemove ?? new List<int>()).ToList(),
                    User.Identity?.Name ?? "Unknown");
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении контрагента с ID {ContractorId}: {ErrorMessage}", id, ex.Message);
                return BadRequest(ex.Message);
            }
        }

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