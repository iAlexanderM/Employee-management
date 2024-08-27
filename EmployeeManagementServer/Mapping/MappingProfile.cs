using AutoMapper;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Contractor, ContractorDto>().ReverseMap();
        // Добавьте другие маппинги по мере необходимости
    }
}