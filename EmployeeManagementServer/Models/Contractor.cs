public class Contractor
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string MiddleName { get; set; }
    public DateTime BirthDate { get; set; }
    public string DocumentType { get; set; }
    public string PassportSerialNumber { get; set; }
    public string PassportIssuedBy { get; set; }
    public DateTime PassportIssueDate { get; set; }
    public string ProductType { get; set; }
    public List<ContractorPhoto> Photos { get; set; } = new List<ContractorPhoto>();
    public bool IsArchived { get; set; } = false; // Для архивации контрагентов
}

public class ContractorPhoto
{
    public int Id { get; set; }
    public int ContractorId { get; set; }
    public Contractor Contractor { get; set; }
    public string FilePath { get; set; }
    public string PhotoType { get; set; } // Тип фото (например, фото для документов)
}