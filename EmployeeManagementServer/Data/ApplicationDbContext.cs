using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using EmployeeManagementServer.Models;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using EmployeeManagementServer.Models.EmployeeManagementServer.Models;
using System.Linq;
using System;
using System.Threading;
using System.Threading.Tasks;

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
        public DbSet<Building> Buildings { get; set; }
        public DbSet<Floor> Floors { get; set; }
        public DbSet<Line> Lines { get; set; }
        public DbSet<StoreNumber> StoreNumbers { get; set; }
        public DbSet<Nationality> Nationalities { get; set; }
        public DbSet<Citizenship> Citizenships { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<DataProtectionKey> DataProtectionKeys { get; set; }
        public DbSet<PassGroup> PassGroups { get; set; }
        public DbSet<PassType> PassTypes { get; set; }
        public DbSet<Pass> Passes { get; set; }
        public DbSet<CloseReason> CloseReasons { get; set; }
        public DbSet<PassTransaction> PassTransactions { get; set; }
        public DbSet<ContractorStorePass> ContractorStorePasses { get; set; }
        public DbSet<QueueToken> QueueTokens { get; set; }
        public DbSet<History> History { get; set; }

        public override int SaveChanges()
        {
            SetTimestamps();
            LogDeletions();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SetTimestamps();
            LogDeletions();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void SetTimestamps()
        {
            var entries = ChangeTracker
                .Entries()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                var createdAtEntry = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "CreatedAt");
                if (createdAtEntry != null)
                {
                    if (entry.State == EntityState.Added)
                    {
                        createdAtEntry.CurrentValue = DateTime.UtcNow;
                        createdAtEntry.IsModified = true;
                    }
                    else if (entry.State == EntityState.Modified)
                    {
                        createdAtEntry.IsModified = false;
                    }
                }

                var updatedAtEntry = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "UpdatedAt");
                if (updatedAtEntry != null)
                {
                    updatedAtEntry.CurrentValue = DateTime.UtcNow;
                    updatedAtEntry.IsModified = true;
                }
            }
        }

        private void LogDeletions()
        {
            var deletedTokens = ChangeTracker.Entries<RefreshToken>()
                .Where(e => e.State == EntityState.Deleted);
            foreach (var entry in deletedTokens)
            {
                Console.WriteLine($"Удаляется RefreshToken: {entry.Entity.Token} (Caller: {new System.Diagnostics.StackTrace().ToString()})");
            }
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.HasDefaultSchema("public");

            builder.Entity<Contractor>()
                .ToTable("Contractors")
                .HasIndex(c => c.PassportSerialNumber)
                .IsUnique();

            builder.Entity<ContractorPhoto>()
                .ToTable("ContractorPhotos")
                .HasOne(cp => cp.Contractor)
                .WithMany(c => c.Photos)
                .HasForeignKey(cp => cp.ContractorId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Store>()
                .ToTable("Stores");

            builder.Entity<History>()
                .ToTable("History")
                .HasIndex(h => new { h.EntityType, h.EntityId, h.ChangedAt });

            builder.Entity<RefreshToken>(entity =>
            {
                entity.ToTable("RefreshTokens");
                entity.HasKey(rt => rt.Token);
                entity.Property(rt => rt.Token).IsRequired();
                entity.Property(rt => rt.UserId).IsRequired();
                entity.Property(rt => rt.Expires).IsRequired();
                entity.Property(rt => rt.LastActive).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(rt => rt.IsRevoked).HasDefaultValue(false);
                entity.HasIndex(rt => rt.Token).IsUnique();
            });

            builder.Entity<PassTransaction>()
                .ToTable("PassTransactions")
                .HasMany(pt => pt.Passes)
                .WithOne(p => p.PassTransaction)
                .HasForeignKey(p => p.PassTransactionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Pass>()
                .ToTable("Passes")
                .HasIndex(p => p.UniquePassId)
                .IsUnique();

            builder.Entity<Pass>()
                .HasOne(p => p.Contractor)
                .WithMany(c => c.Passes)
                .HasForeignKey(p => p.ContractorId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();

            builder.Entity<Pass>()
                .HasOne(p => p.Store)
                .WithMany()
                .HasForeignKey(p => p.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<PassType>()
                .ToTable("PassTypes")
                .HasOne(pt => pt.PassGroup)
                .WithMany(pg => pg.PassTypes)
                .HasForeignKey(pt => pt.PassGroupId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Pass>()
                .HasOne(p => p.PassType)
                .WithMany()
                .HasForeignKey(p => p.PassTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<PassTransaction>()
                .HasOne(t => t.User)
                .WithMany(u => u.PassTransactions)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ContractorStorePass>()
                .ToTable("ContractorStorePasses")
                .HasOne(csp => csp.PassTransaction)
                .WithMany(t => t.ContractorStorePasses)
                .HasForeignKey(csp => csp.PassTransactionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ContractorStorePass>()
                .HasOne(csp => csp.Contractor)
                .WithMany()
                .HasForeignKey(csp => csp.ContractorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ContractorStorePass>()
                .HasOne(csp => csp.Store)
                .WithMany()
                .HasForeignKey(csp => csp.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ContractorStorePass>()
                .HasOne(csp => csp.PassType)
                .WithMany()
                .HasForeignKey(csp => csp.PassTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<QueueToken>()
                .ToTable("QueueTokens")
                .HasOne(qt => qt.User)
                .WithMany(u => u.QueueTokens)
                .HasForeignKey(qt => qt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Building>().ToTable("Buildings");
            builder.Entity<Floor>().ToTable("Floors");
            builder.Entity<Line>().ToTable("Lines");
            builder.Entity<StoreNumber>().ToTable("StoreNumbers");
            builder.Entity<Nationality>().ToTable("Nationalities");
            builder.Entity<Citizenship>().ToTable("Citizenships");
            builder.Entity<PassGroup>().ToTable("PassGroups");
            builder.Entity<CloseReason>().ToTable("CloseReasons");
            builder.Entity<DataProtectionKey>().ToTable("DataProtectionKeys");

            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                var properties = entityType.GetProperties()
                    .Where(p => p.ClrType == typeof(DateTime) || p.ClrType == typeof(DateTime?));

                foreach (var property in properties)
                {
                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetValueConverter(new ValueConverter<DateTime, DateTime>(
                            v => v.ToUniversalTime(),
                            v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
                        ));
                    }
                    else if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(new ValueConverter<DateTime?, DateTime?>(
                            v => v.HasValue ? v.Value.ToUniversalTime() : v,
                            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v
                        ));
                    }
                }
            }
        }
    }
}