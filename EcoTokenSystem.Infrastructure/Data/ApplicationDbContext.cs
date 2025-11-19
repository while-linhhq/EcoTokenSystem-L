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
        }
    }
}
