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
                .ForMember(dest => dest.DocumentPhotos, opt => opt.Ignore())
                .ForMember(dest => dest.PhotosToRemove, opt => opt.Ignore())
                .ForMember(dest => dest.DocumentPhotosToRemove, opt => opt.Ignore())
                .ForMember(dest => dest.ActivePasses, opt => opt.Ignore())
                .ForMember(dest => dest.ClosedPasses, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ForMember(dest => dest.SortOrder, opt => opt.MapFrom(src => src.SortOrder))
                .ForMember(dest => dest.History, opt => opt.Ignore());

            CreateMap<ContractorDto, Contractor>()
                .ForMember(dest => dest.Photos, opt => opt.Ignore())
                .ForMember(dest => dest.Passes, opt => opt.Ignore())
                .ForMember(dest => dest.History, opt => opt.Ignore())
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
            CreateMap<ContractorHistory, ContractorHistoryDto>().ReverseMap();

            CreateMap<Pass, PassDetailsDto>()
                .ForMember(dest => dest.PassTypeName, opt => opt.MapFrom(src => src.PassType != null ? src.PassType.Name : "Unknown"))
                .ForMember(dest => dest.ContractorName, opt => opt.Ignore());
        }
    }
}