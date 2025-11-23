using EcoTokenSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using BCrypt.Net;

namespace EcoTokenSystem.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        // Khai báo GUIDs cố định
        private readonly Guid AdminUserId = Guid.Parse("F3E09F3D-6A2A-47C1-80F1-622ABCE815CA");
        private readonly Guid SampleUserId = Guid.Parse("A3C72B9A-5D2E-4F8A-9A1C-4E1D8A2C9B6A");

        // Khai báo GUIDs cố định cho Items
        private readonly Guid Item1Id = Guid.Parse("E2B1A8C0-4E3D-4B7F-8C9A-6F2E0D1B4C5A"); // Voucher Cây Xanh
        private readonly Guid Item2Id = Guid.Parse("D7A5F4B3-2C1E-4A9D-9B8C-3F0A7E6D5B4C"); // Bình nước
        private readonly Guid Item3Id = Guid.Parse("C1E9D8A7-B6F5-4E3D-2C1B-0A9F8E7D6C5B"); // Ống hút

        // Khai báo GUIDs cố định cho Post mẫu
        private readonly Guid Post1Id = Guid.Parse("1A2B3C4D-5E6F-7A8B-9C0D-1E2F3A4B5C6D"); // Approved Post
        private readonly Guid Post2Id = Guid.Parse("F5E4D3C2-B1A0-9876-5432-10FEDCBA9876"); // Pending Post

        // Khai báo GUIDs cố định cho History mẫu
        private readonly Guid PointHistory1Id = Guid.Parse("B1A2C3D4-E5F6-7890-ABCD-EF0123456789"); // Lịch sử cộng điểm Post1
        private readonly Guid ItemsHistory1Id = Guid.Parse("C9D8E7F6-A5B4-3C2D-1E0F-9876543210AB"); // Lịch sử đổi quà

        public ApplicationDbContext(DbContextOptions dbContextOptions) : base(dbContextOptions)
        {
            // Constructor
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
            // Đảm bảo gói BCrypt.Net-Core đã được cài đặt trong project Infrastructure
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            var adminPasswordHash = HashPassword("Admin@123");
            var userPasswordHash = HashPassword("User@123");

            // --- 1. CẤU HÌNH MỐI QUAN HỆ ---

            // Post <-> User (Tác giả bài viết)
            modelBuilder.Entity<Post>()
                .HasOne(p => p.User)
                .WithMany(u => u.Posts)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Post <-> User (Admin duyệt bài)
            modelBuilder.Entity<Post>()
                .HasOne(p => p.Admin)
                .WithMany(u => u.PostsApproved)
                .HasForeignKey(p => p.AdminId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // PointHistory <-> User (User)
            modelBuilder.Entity<PointHistory>()
                .HasOne(ph => ph.User)
                .WithMany(u => u.PointsHistory)
                .HasForeignKey(ph => ph.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // PointHistory <-> User (Admin)
            modelBuilder.Entity<PointHistory>()
                .HasOne(ph => ph.Admin)
                .WithMany(u => u.TransactionsMade)
                .HasForeignKey(ph => ph.AdminId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // ItemsHistory <-> User
            modelBuilder.Entity<ItemsHistory>()
                .HasOne(ih => ih.User)
                .WithMany(u => u.ItemsHistory)
                .HasForeignKey(ih => ih.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ItemsHistory <-> Items
            modelBuilder.Entity<ItemsHistory>()
                .HasOne(ih => ih.Item)
                .WithMany(i => i.RedemptionHistory)
                .HasForeignKey(ih => ih.ItemId)
                .OnDelete(DeleteBehavior.Restrict);

            // --- 2. SEED DATA CỐ ĐỊNH (Role, Status) ---

            modelBuilder.Entity<PostStatus>().HasData(
                new PostStatus { Id = 1, Name = "Pending" },
                new PostStatus { Id = 2, Name = "Approved" },
                new PostStatus { Id = 3, Name = "Rejected" }
            );
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "User" },
                new Role { Id = 2, Name = "Admin" }
            );

            // --- 3. SEED USERS & ITEMS ---
            modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = AdminUserId,
                Username = "admin",
                PasswordHash = adminPasswordHash,
                RoleId = 2,
                Name = "Quản trị viên Hệ thống",
                CurrentPoints = 99999,
                Streak = 99999,
                CreatedAt = DateTime.UtcNow,
            },
            new User
            {
                Id = SampleUserId,
                Username = "user_test",
                PasswordHash = userPasswordHash,
                RoleId = 1,
                Name = "Nhật Anh",
                CurrentPoints = 1500, // Điểm khởi tạo trước các giao dịch
                CreatedAt = DateTime.UtcNow
            });

            // Seed Items
            modelBuilder.Entity<Items>().HasData(
                new Items { Id = Item1Id, Name = "Voucher Cây Xanh 50k", ImageUrl = "/images/rewards/voucher50k.png", RequiredPoints = 500 },
                new Items { Id = Item2Id, Name = "Bình nước Thân thiện Môi trường", ImageUrl = "/images/rewards/reusablebottle.png", RequiredPoints = 1000 },
                new Items { Id = Item3Id, Name = "Ống hút Inox/Tre", ImageUrl = "/images/rewards/bamboo_straws.png", RequiredPoints = 400 }
            );

            // --- 4. SEED DỮ LIỆU GIAO DỊCH ẢO (FULL SEED) ---

            // 4.1. SEED POSTS
            modelBuilder.Entity<Post>().HasData(
                new Post
                {
                    Id = Post1Id,
                    Title = "Cách phân loại rác hiệu quả",
                    Content = "Đây là bài viết mẫu đã được duyệt.",
                    ImageUrl = "/images/seed/post1.jpg",
                    UserId = SampleUserId,
                    StatusId = 2, // Approved
                    AdminId = AdminUserId,
                    AwardedPoints = 600,
                    SubmittedAt = DateTime.UtcNow.AddDays(-10),
                    ApprovedRejectedAt = DateTime.UtcNow.AddDays(-9),
                },
                new Post
                {
                    Id = Post2Id,
                    Title = "Tại sao cần dùng túi tái chế?  ",
                    Content = "Bài viết mẫu đang chờ duyệt  .",
                    ImageUrl = "/images/seed/post2.jpg",
                    UserId = SampleUserId,
                    StatusId = 1, // Pending
                    SubmittedAt = DateTime.UtcNow.AddDays(-5)
                }
            );

            // 4.2. SEED POINT HISTORY 
            modelBuilder.Entity<PointHistory>().HasData(
                // Giao dịch 1: Cộng điểm từ Post1
                new PointHistory
                {
                    Id = PointHistory1Id,
                    UserId = SampleUserId,
                    AdminId = AdminUserId,
                    PostId = Post1Id,
                    PointsChange = 600,
                    TransactionDate = DateTime.UtcNow.AddDays(-9)
                },
                // Giao dịch 2: Cộng điểm khởi tạo (1500 - 600 = 900)
                new PointHistory
                {
                    Id = Guid.NewGuid(),
                    UserId = SampleUserId,
                    AdminId = AdminUserId,
                    PointsChange = 900,
                    TransactionDate = DateTime.UtcNow.AddDays(-10).AddHours(-1)
                }
            );

            // 4.3. SEED ITEMS HISTORY (User đã đổi quà)
            modelBuilder.Entity<ItemsHistory>().HasData(
                new ItemsHistory
                {
                    Id = ItemsHistory1Id,
                    UserId = SampleUserId,
                    ItemId = Item3Id, // Đổi Ống hút (400 điểm)
                    RedemptionDate = DateTime.UtcNow.AddDays(-3)
                }
            );
        }
    }
}