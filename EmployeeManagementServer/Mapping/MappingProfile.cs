using AutoMapper;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Маппинг между Contractor и ContractorDto
            CreateMap<Contractor, ContractorDto>().ReverseMap();

            // Маппинг между Store и StoreDto
            CreateMap<Store, StoreDto>().ReverseMap();
        }
    }
}
