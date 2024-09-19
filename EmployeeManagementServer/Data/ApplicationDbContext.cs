using EmployeeManagementServer.Models;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace EmployeeManagementServer.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IDataProtectionKeyContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Contractor> Contractors { get; set; }
        public DbSet<ContractorPhoto> ContractorPhoto { get; set; }
        public DbSet<Store> Stores { get; set; }

        public DbSet<DataProtectionKey> DataProtectionKeys { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.HasDefaultSchema("public");

            builder.Entity<Contractor>()
                .HasIndex(c => c.PassportSerialNumber)
                .IsUnique();

            builder.Entity<ContractorPhoto>()
                .ToTable("ContractorPhotos") 
                .HasOne(cp => cp.Contractor)
                .WithMany(c => c.Photos)
                .HasForeignKey(cp => cp.ContractorId);
        }
    }
}
