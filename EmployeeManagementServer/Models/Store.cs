public class Store
{
    public int Id { get; set; }
    public string Building { get; set; }
    public string Floor { get; set; }
    public string Line { get; set; }
    public string StoreNumber { get; set; }
    public int ContractorId { get; set; }
    public Contractor Contractor { get; set; }
}