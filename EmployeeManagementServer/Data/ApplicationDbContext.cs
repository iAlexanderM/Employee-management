using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Models;

namespace EmployeeManagementServer.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public ApplicationDbContext() { }

        public DbSet<Contractor> Contractors { get; set; }
        public DbSet<ContractorPhoto> ContractorPhotos { get; set; }
        public DbSet<Store> Stores { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Contractor>()
                .HasIndex(c => c.PassportSerialNumber)
                .IsUnique();

            builder.Entity<ContractorPhoto>()
                .HasOne(cp => cp.Contractor)
                .WithMany(c => c.Photos)
                .HasForeignKey(cp => cp.ContractorId);
        }
    }
}