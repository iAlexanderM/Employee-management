using AutoMapper;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;

namespace EmployeeManagementServer.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Building, BuildingDto>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ReverseMap()
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

            CreateMap<Contractor, ContractorDto>()
                .ForMember(dest => dest.Photos, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ForMember(dest => dest.SortOrder, opt => opt.MapFrom(src => src.SortOrder))
                .ReverseMap()
                .ForMember(dest => dest.Photos, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

            CreateMap<Floor, FloorDto>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ReverseMap()
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

            CreateMap<Line, LineDto>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ReverseMap()
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

            CreateMap<StoreNumber, StoreNumberDto>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ReverseMap()
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

            CreateMap<Store, StoreDto>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ReverseMap()
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());
            CreateMap<Nationality, NationalityDto>().ReverseMap();
            CreateMap<Citizenship, CitizenshipDto>().ReverseMap();
            CreateMap<Position, PositionDto>().ReverseMap();
        }
    }
}
