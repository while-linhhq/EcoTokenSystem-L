using EcoTokenSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly Guid AdminUserId = Guid.Parse("F3E09F3D-6A2A-47C1-80F1-622ABCE815CA");
        private readonly Guid SampleUserId = new Guid("A3C72B9A-5D2E-4F8A-9A1C-4E1D8A2C9B6A"); 
        public ApplicationDbContext(DbContextOptions dbContextOptions):base(dbContextOptions)
        {
            
        }

        

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<PostStatus> PostStatuses { get; set; }
        public DbSet<PointHistory> PointHistories { get; set; }
        public DbSet<Items> Items { get; set; }
        public DbSet<ItemsHistory> ItemsHistory { get; set; }

        private static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            modelBuilder.Entity<Post>()
                .HasOne(p => p.User)
                .WithMany(u => u.Posts)    
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict); 

            modelBuilder.Entity<Post>()
                .HasOne(p => p.Admin)
                .WithMany(u => u.PostsApproved) 
                .HasForeignKey(p => p.AdminId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);


            modelBuilder.Entity<PointHistory>()
                .HasOne(ph => ph.User)
                .WithMany(u => u.PointsHistory) 
                .HasForeignKey(ph => ph.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PointHistory>()
                .HasOne(ph => ph.Admin)
                .WithMany(u => u.TransactionsMade)  
                .HasForeignKey(ph => ph.AdminId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);  
              
            modelBuilder.Entity<ItemsHistory>()
                .HasOne(ih => ih.User)
                .WithMany(u => u.ItemsHistory)
                .HasForeignKey(ih => ih.UserId)
                .OnDelete(DeleteBehavior.Restrict);
             
            modelBuilder.Entity<ItemsHistory>()
                .HasOne(ih => ih.Item)
                .WithMany(i => i.RedemptionHistory)
                .HasForeignKey(ih => ih.ItemId)
                .OnDelete(DeleteBehavior.Restrict);

            var adminUserId = new Guid("F3E09F3D-6A2A-47C1-80F1-622ABCE815CA");
            var sampleUserId = new Guid("A3C72B9A-5D2E-4F8A-9A1C-4E1D8A2C9B6A");
            var adminPasswordHash = HashPassword("Admin@123");
            var userPasswordHash = HashPassword("User@123");

            modelBuilder.Entity<PostStatus>()
                .HasData(
                    new PostStatus { Id = 1, Name = "Pending" },
                    new PostStatus { Id = 2, Name = "Approved" },
                    new PostStatus { Id = 3, Name = "Rejected" }
                );

            modelBuilder.Entity<Role>()
                .HasData(
                    new Role { Id = 1, Name = "User" },
                    new Role { Id = 2, Name = "Admin" }
                );

            modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = AdminUserId,
                Username = "admin",
                PasswordHash = adminPasswordHash,
                RoleId = 2,  
                Name = "Quản trị viên Hệ thống",
                DateOfBirth = DateTime.UtcNow,
                Gender="Nữ",
                PhoneNumber = "",
                Address = "TP Hồ Chí Minh",
                CurrentPoints = 99999,
                Streak = 99999,
                CreatedAt = DateTime.UtcNow,
            });

            modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = sampleUserId,
                Username = "user_test",
                PasswordHash = userPasswordHash,
                RoleId = 1,  
                Name = "Người dùng thử nghiệm",
                CurrentPoints = 1500,
                Gender = "Nam",
                PhoneNumber = "",
                Address = "TP Hồ Chí Minh",
                DateOfBirth = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            }
        );

            modelBuilder.Entity<Items>().HasData(
            new Items
            {
                Id = new Guid("E2B1A8C0-4E3D-4B7F-8C9A-6F2E0D1B4C5A"),
                Name = "Voucher Cây Xanh 50k",
                ImageUrl = "/images/rewards/voucher50k.png",
                RequiredPoints = 500, // 500 điểm
            },
            new Items
            {
                Id = new Guid("D7A5F4B3-2C1E-4A9D-9B8C-3F0A7E6D5B4C"),
                Name = "Bình nước Thân thiện Môi trường",
                ImageUrl = "/images/rewards/reusablebottle.png",
                RequiredPoints = 1000, // 1000 điểm
            },
            new Items
            {
                Id = new Guid("C1E9D8A7-B6F5-4E3D-2C1B-0A9F8E7D6C5B"),
                Name = "1 Tháng Membership Premium",
                ImageUrl = "/images/rewards/premium.png",
                RequiredPoints = 2500, // 2500 điểm
            }
        );
        }
    }
}
