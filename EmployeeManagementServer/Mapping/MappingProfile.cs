using AutoMapper;
using EmployeeManagementServer.Models;
using EmployeeManagementServer.Models.DTOs;
using System.Text.Json;

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
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ForMember(dest => dest.SortOrder, opt => opt.MapFrom(src => src.SortOrder))
                .ReverseMap()
                .ForMember(dest => dest.Photos, opt => opt.Ignore())
                .ForMember(dest => dest.Passes, opt => opt.Ignore())
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

            CreateMap<History, HistoryDto>()
                .ForMember(dest => dest.Changes, opt => opt.MapFrom(src => HistoryMappingHelper.DeserializeChanges(src.ChangesJson)))
                .ForMember(dest => dest.ChangedBy, opt => opt.NullSubstitute("Unknown"));

            CreateMap<HistoryDto, History>()
                .ForMember(dest => dest.ChangesJson, opt => opt.MapFrom(src => HistoryMappingHelper.SerializeChanges(src.Changes)))
                .ForMember(dest => dest.ChangedBy, opt => opt.NullSubstitute("Unknown"));
        }
    }
}