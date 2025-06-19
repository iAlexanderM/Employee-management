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

            CreateMap<ApplicationUser, UserDto>();

            CreateMap<ContractorPhoto, ContractorPhotoDto>();

            CreateMap<Contractor, ContractorDto>()
                .ForMember(dest => dest.Photos, opt => opt.MapFrom(src => src.Photos))
                .ForMember(dest => dest.DocumentPhotos, opt => opt.MapFrom(src => src.Photos.Where(p => p.IsDocumentPhoto)))
                .ForMember(dest => dest.ActivePasses, opt => opt.MapFrom(src => src.Passes.Where(p => !p.IsClosed)))
                .ForMember(dest => dest.ClosedPasses, opt => opt.MapFrom(src => src.Passes.Where(p => p.IsClosed)));

            CreateMap<ContractorDto, Contractor>()
                .ForMember(dest => dest.Photos, opt => opt.Ignore())
                .ForMember(dest => dest.Passes, opt => opt.Ignore());

            CreateMap<ContractorCreateDto, Contractor>()
                .ForMember(dest => dest.Photos, opt => opt.Ignore())
                .ForMember(dest => dest.Passes, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

            CreateMap<ContractorUpdateDto, Contractor>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Photos, opt => opt.Ignore())
                .ForMember(dest => dest.Passes, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

            CreateMap<PassType, PassTypeDto>().ReverseMap();

            CreateMap<Pass, PassDto>().ReverseMap();

            CreateMap<Pass, PassDetailsDto>()
                .ForMember(dest => dest.PassTypeName, opt => opt.MapFrom(src => src.PassType.Name))
                .ForMember(dest => dest.PassTypeColor, opt => opt.MapFrom(src => src.PassType.Color))
                .ForMember(dest => dest.PassTypeDurationInMonths, opt => opt.MapFrom(src => src.PassType.DurationInMonths))
                .ForMember(dest => dest.Cost, opt => opt.MapFrom(src => src.PassType.Cost))
                .ForMember(dest => dest.ContractorName, opt => opt.MapFrom(src => src.Contractor != null ? $"{src.Contractor.FirstName} {src.Contractor.LastName}".Trim() : null))
                .ForMember(dest => dest.ContractorPhotoPath, opt => opt.MapFrom(src => src.Contractor.Photos.FirstOrDefault(p => !p.IsDocumentPhoto) != null ? src.Contractor.Photos.FirstOrDefault(p => !p.IsDocumentPhoto).FilePath : null))
                .ForMember(dest => dest.Building, opt => opt.MapFrom(src => src.Store != null ? src.Store.Building : null))
                .ForMember(dest => dest.Floor, opt => opt.MapFrom(src => src.Store != null ? src.Store.Floor : null))
                .ForMember(dest => dest.Line, opt => opt.MapFrom(src => src.Store != null ? src.Store.Line : null))
                .ForMember(dest => dest.StoreNumber, opt => opt.MapFrom(src => src.Store != null ? src.Store.StoreNumber : null))
                .ForMember(dest => dest.ClosedBy, opt => opt.MapFrom(src => src.ClosedByUser != null ? src.ClosedByUser.UserName : null));
        }
    }
}