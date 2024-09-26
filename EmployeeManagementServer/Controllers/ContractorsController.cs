using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.IO;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class ContractorsController : ControllerBase
	{
		private readonly ContractorService _contractorService;
		private readonly IMapper _mapper;

		public ContractorsController(ContractorService contractorService, IMapper mapper)
		{
			_contractorService = contractorService;
			_mapper = mapper;
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
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			// Проверяем, существует ли контрагент с таким номером паспорта
			var existingContractor = await _contractorService.FindContractorByPassportSerialNumberAsync(contractorDto.PassportSerialNumber);
			if (existingContractor != null)
			{
				return BadRequest("Контрагент с таким номером паспорта уже существует.");
			}

			// Маппинг DTO на модель, игнорируем поле с фотографиями
			var contractor = _mapper.Map<Contractor>(contractorDto);

			// Сохранение обычных фотографий
			if (contractorDto.Photos != null && contractorDto.Photos.Count > 0)
			{
				foreach (var photo in contractorDto.Photos)
				{
					var photoPath = await _contractorService.SavePhoto(photo, false); // Обычные фотографии
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
					var docPhotoPath = await _contractorService.SavePhoto(docPhoto, true); // Фотографии документов
					contractor.Photos.Add(new ContractorPhoto
					{
						FilePath = docPhotoPath,
						IsDocumentPhoto = true
					});
				}
			}

			// Сохранение контрагента
			await _contractorService.CreateContractorAsync(contractor);

			return Ok(contractor);
		}
	}
}
