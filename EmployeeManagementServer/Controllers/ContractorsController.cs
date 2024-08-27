using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

[Route("api/[controller]")]
[ApiController]
public class ContractorsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ContractorsController(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ContractorDto>>> GetContractors()
    {
        var contractors = await _context.Contractors.ToListAsync();
        var contractorDtos = _mapper.Map<IEnumerable<ContractorDto>>(contractors);
        return Ok(contractorDtos);
    }

    [HttpPost]
    public async Task<ActionResult<ContractorDto>> CreateContractor(ContractorDto contractorDto)
    {
        var contractor = _mapper.Map<Contractor>(contractorDto);
        _context.Contractors.Add(contractor);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetContractors), new { id = contractor.Id }, contractorDto);
    }
}
