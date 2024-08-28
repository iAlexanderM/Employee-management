using EmployeeManagementServer.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Определение DbSet для моделей
    public DbSet<Contractor> Contractors { get; set; }
    public DbSet<ContractorPhoto> ContractorPhotos { get; set; }
    public DbSet<Store> Stores { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema("public");

        builder.Entity<Contractor>()
            .HasIndex(c => c.PassportSerialNumber)
            .IsUnique();

        builder.Entity<ContractorPhoto>()
            .HasOne(cp => cp.Contractor)
            .WithMany(c => c.Photos)
            .HasForeignKey(cp => cp.ContractorId);
    }
}