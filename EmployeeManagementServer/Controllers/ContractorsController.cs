using Microsoft.AspNetCore.Mvc;
using EmployeeManagementServer.Models.DTOs;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagementServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Добавляем авторизацию
    public class ContractorsController : ControllerBase
    {
        private readonly IContractorService _contractorService;
        private readonly IMapper _mapper;

        public ContractorsController(IContractorService contractorService, IMapper mapper)
        {
            _contractorService = contractorService;
            _mapper = mapper;
        }

        // GET: api/Contractors
        [HttpGet]
        public async Task<IActionResult> GetContractors()
        {
            var contractors = await _contractorService.GetAllContractorsAsync();
            return Ok(contractors);
        }

        // GET: api/Contractors/5
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

        // POST: api/Contractors
        [HttpPost]
        public async Task<IActionResult> CreateContractor([FromBody] ContractorDto contractorDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var contractor = _mapper.Map<Contractor>(contractorDto);
            await _contractorService.AddContractorAsync(contractor);
            return CreatedAtAction(nameof(GetContractor), new { id = contractor.Id }, contractor);
        }

        // PUT: api/Contractors/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateContractor(int id, [FromBody] ContractorDto contractorDto)
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
            await _contractorService.UpdateContractorAsync(contractor);
            return NoContent();
        }

        // DELETE: api/Contractors/5
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
