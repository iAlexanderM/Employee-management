using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Globalization;
using System.IO;

namespace EmployeeManagementServer.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class ContractorsController : ControllerBase
	{
		private readonly IContractorService _contractorService;
		private readonly IMapper _mapper;

		public ContractorsController(IContractorService contractorService, IMapper mapper)
		{
			_contractorService = contractorService;
			_mapper = mapper;
		}

		[HttpGet]
		public async Task<IActionResult> GetContractors()
		{
			var contractors = await _contractorService.GetAllContractorsAsync();
			return Ok(contractors);
		}

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

		[HttpPost]
		public async Task<IActionResult> CreateContractor([FromForm] ContractorDto contractorDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			var contractor = _mapper.Map<Contractor>(contractorDto);

			// Преобразование даты
			if (!DateTime.TryParseExact(contractorDto.BirthDate, "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var birthDate))
			{
				return BadRequest("Invalid birth date format. Please use dd.MM.yyyy.");
			}

			if (!DateTime.TryParseExact(contractorDto.PassportIssueDate, "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var passportIssueDate))
			{
				return BadRequest("Invalid passport issue date format. Please use dd.MM.yyyy.");
			}

			contractor.BirthDate = DateTime.SpecifyKind(birthDate, DateTimeKind.Utc);
			contractor.PassportIssueDate = DateTime.SpecifyKind(passportIssueDate, DateTimeKind.Utc);

			// Обработка обычных фотографий
			if (contractorDto.Photos != null)
			{
				foreach (var photo in contractorDto.Photos)
				{
					if (photo.Length > 0)
					{
						var filePath = Path.Combine("wwwroot/uploads/photos", photo.FileName);
						using (var stream = new FileStream(filePath, FileMode.Create))
						{
							await photo.CopyToAsync(stream);
						}
						contractor.Photos.Add(new ContractorPhoto { FilePath = filePath, IsDocumentPhoto = false });
					}
				}
			}

			// Обработка фото документов
			if (contractorDto.DocumentPhotos != null)
			{
				foreach (var documentPhoto in contractorDto.DocumentPhotos)
				{
					if (documentPhoto.Length > 0)
					{
						var filePath = Path.Combine("wwwroot/uploads/documents", documentPhoto.FileName);
						using (var stream = new FileStream(filePath, FileMode.Create))
						{
							await documentPhoto.CopyToAsync(stream);
						}
						contractor.Photos.Add(new ContractorPhoto { FilePath = filePath, IsDocumentPhoto = true });
					}
				}
			}

			await _contractorService.AddContractorAsync(contractor);
			return CreatedAtAction(nameof(GetContractor), new { id = contractor.Id }, contractor);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> UpdateContractor(int id, [FromForm] ContractorDto contractorDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			var contractor = await _contractorService.GetContractorByIdAsync(id);
			if (contractor == null)
			{
				return NotFound();
			}

			_mapper.Map(contractorDto, contractor);

			// Обработка фото для обновления
			if (contractorDto.Photos != null)
			{
				foreach (var photo in contractorDto.Photos)
				{
					if (photo.Length > 0)
					{
						var filePath = Path.Combine("wwwroot/uploads/photos", photo.FileName);
						using (var stream = new FileStream(filePath, FileMode.Create))
						{
							await photo.CopyToAsync(stream);
						}
						contractor.Photos.Add(new ContractorPhoto { FilePath = filePath, IsDocumentPhoto = false });
					}
				}
			}

			if (contractorDto.DocumentPhotos != null)
			{
				foreach (var documentPhoto in contractorDto.DocumentPhotos)
				{
					if (documentPhoto.Length > 0)
					{
						var filePath = Path.Combine("wwwroot/uploads/documents", documentPhoto.FileName);
						using (var stream = new FileStream(filePath, FileMode.Create))
						{
							await documentPhoto.CopyToAsync(stream);
						}
						contractor.Photos.Add(new ContractorPhoto { FilePath = filePath, IsDocumentPhoto = true });
					}
				}
			}

			await _contractorService.UpdateContractorAsync(contractor);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteContractor(int id)
		{
			var contractor = await _contractorService.GetContractorByIdAsync(id);
			if (contractor == null)
			{
				return NotFound();
			}

			await _contractorService.ArchiveContractorAsync(contractor);
			return NoContent();
		}
	}
}
