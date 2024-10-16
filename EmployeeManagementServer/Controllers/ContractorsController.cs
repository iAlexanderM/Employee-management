using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

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

        public ContractorsController(
            ContractorService contractorService,
            IMapper mapper,
            ILogger<ContractorsController> logger)
        {
            _contractorService = contractorService;
            _mapper = mapper;
            _logger = logger;
        }

        // Получение всех контрагентов
        [HttpGet]
        public async Task<IActionResult> GetContractors()
        {
            var contractors = await _contractorService.GetAllContractorsAsync();
            return Ok(contractors);
        }

        // Получение контрагента по идентификатору
        [HttpGet("{id}")]
        public async Task<IActionResult> GetContractor(int id)
        {
            var contractor = await _contractorService.GetContractorByIdAsync(id);
            if (contractor == null)
            {
                return NotFound();
            }

            return Ok(contractor);
        }

        // Создание нового контрагента
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

            // Сохранение обычных фотографий
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

            // Сохранение фотографий документов
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
            _logger.LogInformation($"Контрагент с {contractorDto.Id} успешно создан.");
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

            // Получаем текущего контрагента из базы данных
            var contractor = await _contractorService.GetContractorByIdAsync(id);
            if (contractor == null)
            {
                _logger.LogWarning("Контрагент с ID {Id} не найден.", id);
                return NotFound($"Контрагент с ID {id} не найден.");
            }

            // Проверяем, изменился ли номер паспорта и проверяем уникальность только в случае изменения
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
                // Обновляем текстовые поля контрагента на основе данных из DTO
                UpdateContractorDetails(contractor, contractorDto);

                // Обновляем фотографии через сервис, объединяя списки фотографий для удаления
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
        }
    }
}