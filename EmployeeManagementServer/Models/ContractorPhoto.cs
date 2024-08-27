public class ContractorPhoto
{
    public int Id { get; set; }
    public int ContractorId { get; set; }
    public Contractor Contractor { get; set; }
    public string FilePath { get; set; }
    public string PhotoType { get; set; } // Тип фото (например, фото для документов)
}