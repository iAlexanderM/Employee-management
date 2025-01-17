using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementServer.Models;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System;
using System.Linq;
using EmployeeManagementServer.Models.EmployeeManagementServer.Models;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;

namespace EmployeeManagementServer.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IDataProtectionKeyContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSet для всех сущностей
        public DbSet<Contractor> Contractors { get; set; }
        public DbSet<ContractorPhoto> ContractorPhoto { get; set; }
        public DbSet<Store> Stores { get; set; }
        public DbSet<Building> Buildings { get; set; }
        public DbSet<Floor> Floors { get; set; }
        public DbSet<Line> Lines { get; set; }
        public DbSet<StoreNumber> StoreNumbers { get; set; }
        public DbSet<Nationality> Nationalities { get; set; }
        public DbSet<Citizenship> Citizenships { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        public DbSet<DataProtectionKey> DataProtectionKeys { get; set; }

        public DbSet<PassGroup> PassGroups { get; set; }
        public DbSet<PassType> PassTypes { get; set; }
        public DbSet<Pass> Passes { get; set; }
        public DbSet<CloseReason> CloseReasons { get; set; }

        public DbSet<PassTransaction> PassTransactions { get; set; }

        public DbSet<QueueToken> QueueTokens { get; set; } // Добавлено

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Установка схемы по умолчанию
            builder.HasDefaultSchema("public");

            // Уникальные индексы и другие настройки
            builder.Entity<Contractor>()
                .HasIndex(c => c.PassportSerialNumber)
                .IsUnique();

            builder.Entity<ContractorPhoto>()
                .ToTable("ContractorPhotos")
                .HasOne(cp => cp.Contractor)
                .WithMany(c => c.Photos)
                .HasForeignKey(cp => cp.ContractorId);

            builder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(rt => rt.Token);
                entity.Property(rt => rt.Token).IsRequired();
                entity.Property(rt => rt.UserId).IsRequired();
                entity.Property(rt => rt.Expires).IsRequired();
                entity.Property(rt => rt.LastActive).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(rt => rt.IsRevoked).HasDefaultValue(false);
                entity.HasIndex(rt => rt.Token).IsUnique();
            });

            // Уникальный индекс для пропусков
            builder.Entity<Pass>()
                .HasIndex(p => p.UniquePassId)
                .IsUnique();

            // Настройка связей PassType -> PassGroup
            builder.Entity<PassType>()
                .HasOne(pt => pt.PassGroup)
                .WithMany(pg => pg.PassTypes)
                .HasForeignKey(pt => pt.PassGroupId);

            // Настройка связей Pass -> PassType, Contractor, Store
            builder.Entity<Pass>()
                .HasOne(p => p.PassType)
                .WithMany()
                .HasForeignKey(p => p.PassTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Pass>()
                .HasOne(p => p.Contractor)
                .WithMany()
                .HasForeignKey(p => p.ContractorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Pass>()
                .HasOne(p => p.Store)
                .WithMany()
                .HasForeignKey(p => p.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            // Настройка связей PassTransaction -> Contractor, Store, PassType, User, Pass
            builder.Entity<PassTransaction>()
                .HasOne(t => t.Contractor)
                .WithMany()
                .HasForeignKey(t => t.ContractorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<PassTransaction>()
                .HasOne(t => t.Store)
                .WithMany()
                .HasForeignKey(t => t.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<PassTransaction>()
                .HasOne(t => t.PassType)
                .WithMany()
                .HasForeignKey(t => t.PassTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<PassTransaction>()
                .Property(t => t.Token)
                .IsRequired();

            builder.Entity<PassTransaction>()
                .HasIndex(t => t.Token)
                .IsUnique(); // Уникальный индекс для номера талона

            // Связь PassTransaction -> ApplicationUser
            builder.Entity<PassTransaction>()
                .HasOne(pt => pt.User)
                .WithMany(u => u.PassTransactions)
                .HasForeignKey(pt => pt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Связь PassTransaction -> Pass (один к одному)
            builder.Entity<PassTransaction>()
                .HasOne(pt => pt.Pass)
                .WithOne(p => p.PassTransaction)
                .HasForeignKey<PassTransaction>(pt => pt.PassId)
                .OnDelete(DeleteBehavior.Cascade);

            // Настройка связей QueueToken -> ApplicationUser
            builder.Entity<QueueToken>()
                .HasOne(qt => qt.User)
                .WithMany(u => u.QueueTokens)
                .HasForeignKey(qt => qt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Настройка конвертеров для DateTime
            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                // Получение всех свойств типа DateTime и DateTime?
                var properties = entityType.GetProperties()
                    .Where(p => p.ClrType == typeof(DateTime) || p.ClrType == typeof(DateTime?));

                foreach (var property in properties)
                {
                    // Обрабатываем DateTime и DateTime?
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
