using AutoMapper;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Mappings
{
	public class MappingProfile : Profile
	{
        public MappingProfile()
        {
            CreateMap<Contractor, ContractorDto>()
               .ForMember(dest => dest.Photos, opt => opt.Ignore())
               .ReverseMap()
               .ForMember(dest => dest.Photos, opt => opt.Ignore());
        }
    }
}
