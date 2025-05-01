using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using EmployeeManagementServer.Models;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
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
        public DbSet<ContractorHistory> ContractorHistories { get; set; }
        public DbSet<Store> Stores { get; set; }
        public DbSet<StoreHistory> StoreHistories { get; set; }
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

        public override int SaveChanges()
        {
            LogDeletions();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            LogDeletions();
            return base.SaveChangesAsync(cancellationToken);
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

            // Contractor
            builder.Entity<Contractor>()
                .ToTable("Contractors")
                .HasIndex(c => c.PassportSerialNumber)
                .IsUnique();

            // ContractorPhoto
            builder.Entity<ContractorPhoto>()
                .ToTable("ContractorPhotos")
                .HasOne(cp => cp.Contractor)
                .WithMany(c => c.Photos)
                .HasForeignKey(cp => cp.ContractorId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ContractorHistory>()
                .ToTable("ContractorHistories")
                .HasOne(ch => ch.Contractor)
                .WithMany(c => c.History)
                .HasForeignKey(ch => ch.ContractorId)
                .OnDelete(DeleteBehavior.Cascade);

            // RefreshToken
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

            // PassTransaction и Pass
            builder.Entity<PassTransaction>()
                .ToTable("PassTransactions")
                .HasMany(pt => pt.Passes)
                .WithOne(p => p.PassTransaction)
                .HasForeignKey(p => p.PassTransactionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Pass
            builder.Entity<Pass>()
                .ToTable("Passes")
                .HasIndex(p => p.UniquePassId)
                .IsUnique();

            // Исправленная связь Pass -> Contractor
            builder.Entity<Pass>()
                .HasOne(p => p.Contractor)
                .WithMany(c => c.Passes) // Явно указываем коллекцию Passes
                .HasForeignKey(p => p.ContractorId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(); // Указываем, что ContractorId обязателен

            // PassType
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

            // Store
            builder.Entity<Pass>()
                .HasOne(p => p.Store)
                .WithMany()
                .HasForeignKey(p => p.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<StoreHistory>()
                .ToTable("StoreHistories")
                .HasOne(sh => sh.Store)
                .WithMany(s => s.History)
                .HasForeignKey(sh => sh.StoreId)
                .OnDelete(DeleteBehavior.Cascade);

            // PassTransaction (дополнительные связи)
            builder.Entity<PassTransaction>()
                .HasOne(t => t.User)
                .WithMany(u => u.PassTransactions)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ContractorStorePass
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

            // QueueToken
            builder.Entity<QueueToken>()
                .ToTable("QueueTokens")
                .HasOne(qt => qt.User)
                .WithMany(u => u.QueueTokens)
                .HasForeignKey(qt => qt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Остальные сущности
            builder.Entity<Store>().ToTable("Stores");
            builder.Entity<Building>().ToTable("Buildings");
            builder.Entity<Floor>().ToTable("Floors");
            builder.Entity<Line>().ToTable("Lines");
            builder.Entity<StoreNumber>().ToTable("StoreNumbers");
            builder.Entity<Nationality>().ToTable("Nationalities");
            builder.Entity<Citizenship>().ToTable("Citizenships");
            builder.Entity<PassGroup>().ToTable("PassGroups");
            builder.Entity<CloseReason>().ToTable("CloseReasons");
            builder.Entity<DataProtectionKey>().ToTable("DataProtectionKeys");

            // Конвертация DateTime в UTC
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