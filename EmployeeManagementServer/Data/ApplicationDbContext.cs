using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using EmployeeManagementServer.Models;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Linq;
using System;
using System.Threading;
using System.Threading.Tasks;
using EmployeeManagementServer.Models.EmployeeManagementServer.Models;

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

            // Set default schema
            builder.HasDefaultSchema("public");

            // Contractor configuration
            builder.Entity<Contractor>()
                .ToTable("Contractors")
                .HasIndex(c => c.PassportSerialNumber)
                .IsUnique()
                .HasDatabaseName("idx_contractors_passport_serial_number");

            // ContractorPhoto configuration
            builder.Entity<ContractorPhoto>()
                .ToTable("ContractorPhotos")
                .HasOne(cp => cp.Contractor)
                .WithMany(c => c.Photos)
                .HasForeignKey(cp => cp.ContractorId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ContractorPhoto>()
                .HasIndex(cp => cp.ContractorId)
                .HasDatabaseName("idx_contractor_photos_contractor_id");

            // Store configuration
            builder.Entity<Store>()
                .ToTable("Stores")
                .HasIndex(s => s.Building)
                .HasDatabaseName("idx_stores_building");

            builder.Entity<Store>()
                .HasIndex(s => s.Floor)
                .HasDatabaseName("idx_stores_floor");

            builder.Entity<Store>()
                .HasIndex(s => s.Line)
                .HasDatabaseName("idx_stores_line");

            builder.Entity<Store>()
                .HasIndex(s => s.StoreNumber)
                .HasDatabaseName("idx_stores_store_number");

            builder.Entity<Store>()
                .HasIndex(s => s.IsArchived)
                .HasDatabaseName("idx_stores_is_archived");

            builder.Entity<Store>()
                .HasIndex(s => new { s.Building, s.Floor, s.Line, s.StoreNumber })
                .HasDatabaseName("idx_stores_location");

            // History configuration
            builder.Entity<History>()
                .ToTable("History")
                .HasIndex(h => new { h.EntityType, h.EntityId, h.ChangedAt })
                .HasDatabaseName("idx_history_entity_type_id_changed_at");

            // RefreshToken configuration
            builder.Entity<RefreshToken>()
                .ToTable("RefreshTokens")
                .HasKey(rt => rt.Token)
                .HasName("pk_refresh_tokens");

            builder.Entity<RefreshToken>()
                .Property(rt => rt.Token)
                .IsRequired();

            builder.Entity<RefreshToken>()
                .Property(rt => rt.UserId)
                .IsRequired();

            builder.Entity<RefreshToken>()
                .Property(rt => rt.Expires)
                .IsRequired();

            builder.Entity<RefreshToken>()
                .Property(rt => rt.LastActive)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Entity<RefreshToken>()
                .Property(rt => rt.IsRevoked)
                .HasDefaultValue(false);

            builder.Entity<RefreshToken>()
                .HasIndex(rt => rt.Token)
                .IsUnique()
                .HasDatabaseName("idx_refresh_tokens_token");

            // PassTransaction configuration
            builder.Entity<PassTransaction>()
                .ToTable("PassTransactions")
                .HasMany(pt => pt.Passes)
                .WithOne(p => p.PassTransaction)
                .HasForeignKey(p => p.PassTransactionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PassTransaction>()
                .HasIndex(pt => pt.CreatedAt)
                .HasDatabaseName("idx_pass_transactions_created_at");

            builder.Entity<PassTransaction>()
                .HasIndex(pt => pt.Token)
                .HasDatabaseName("idx_pass_transactions_token");

            builder.Entity<PassTransaction>()
                .HasOne(t => t.User)
                .WithMany(u => u.PassTransactions)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Pass configuration
            builder.Entity<Pass>()
                .ToTable("Passes")
                .HasIndex(p => p.UniquePassId)
                .IsUnique()
                .HasDatabaseName("idx_passes_unique_pass_id");

            builder.Entity<Pass>()
                .HasIndex(p => p.StoreId)
                .HasDatabaseName("idx_passes_store_id");

            builder.Entity<Pass>()
                .HasIndex(p => p.IsClosed)
                .HasDatabaseName("idx_passes_is_closed");

            builder.Entity<Pass>()
                .HasIndex(p => p.PassTransactionId)
                .HasDatabaseName("idx_passes_pass_transaction_id");

            builder.Entity<Pass>()
                .HasIndex(p => p.EndDate)
                .HasDatabaseName("idx_passes_end_date");

            builder.Entity<Pass>()
                .HasIndex(p => p.ContractorId)
                .HasDatabaseName("idx_passes_contractor_id");

            builder.Entity<Pass>()
                .HasIndex(p => p.ClosedByUserId)
                .HasDatabaseName("idx_passes_closed_by_user_id");

            builder.Entity<Pass>()
                .HasIndex(p => p.PassStatus)
                .HasDatabaseName("idx_passes_pass_status"); // Новый индекс

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

            builder.Entity<Pass>()
                .HasOne(p => p.PassType)
                .WithMany()
                .HasForeignKey(p => p.PassTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // PassType configuration
            builder.Entity<PassType>()
                .ToTable("PassTypes")
                .HasIndex(pt => pt.Name)
                .HasDatabaseName("idx_pass_types_name");

            builder.Entity<PassType>()
                .HasOne(pt => pt.PassGroup)
                .WithMany(pg => pg.PassTypes)
                .HasForeignKey(pt => pt.PassGroupId)
                .OnDelete(DeleteBehavior.Cascade);

            // ContractorStorePass configuration
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

            builder.Entity<ContractorStorePass>()
                .HasIndex(csp => csp.PassTransactionId)
                .HasDatabaseName("idx_contractor_store_passes_pass_transaction_id");

            builder.Entity<ContractorStorePass>()
                .HasIndex(csp => csp.StoreId)
                .HasDatabaseName("idx_contractor_store_passes_store_id");

            builder.Entity<ContractorStorePass>()
                .HasIndex(csp => csp.ContractorId)
                .HasDatabaseName("idx_contractor_store_passes_contractor_id");

            // QueueToken configuration
            builder.Entity<QueueToken>()
                .ToTable("QueueTokens")
                .HasIndex(qt => qt.Token)
                .HasDatabaseName("idx_queue_tokens_token");

            builder.Entity<QueueToken>()
                .HasIndex(qt => qt.TokenType)
                .HasDatabaseName("idx_queue_tokens_token_type");

            builder.Entity<QueueToken>()
                .HasOne(qt => qt.User)
                .WithMany(u => u.QueueTokens)
                .HasForeignKey(qt => qt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Other entity configurations
            builder.Entity<Building>()
                .ToTable("Buildings");

            builder.Entity<Floor>()
                .ToTable("Floors");

            builder.Entity<Line>()
                .ToTable("Lines");

            builder.Entity<StoreNumber>()
                .ToTable("StoreNumbers");

            builder.Entity<Nationality>()
                .ToTable("Nationalities");

            builder.Entity<Citizenship>()
                .ToTable("Citizenships");

            builder.Entity<PassGroup>()
                .ToTable("PassGroups");

            builder.Entity<CloseReason>()
                .ToTable("CloseReasons");

            builder.Entity<DataProtectionKey>()
                .ToTable("DataProtectionKeys");

            // DateTime conversions for UTC
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