using EmployeeManagementServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Contractor> Contractors { get; set; }
    public DbSet<Store> Stores { get; set; }
    public DbSet<ContractorPhoto> ContractorPhotos { get; set; }
}

public class ApplicationUser : IdentityUser
{
    // Дополнительные свойства пользователя можно добавить здесь
}