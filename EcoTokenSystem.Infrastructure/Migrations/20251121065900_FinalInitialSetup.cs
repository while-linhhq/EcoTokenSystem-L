using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EcoTokenSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FinalInitialSetup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequiredPoints = table.Column<int>(type: "int", nullable: false),
                    Tag = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: "handmade")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Items", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PostStatuses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CurrentPoints = table.Column<int>(type: "int", nullable: false),
                    Streak = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ItemsHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RedemptionDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemsHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemsHistory_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ItemsHistory_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Posts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StatusId = table.Column<int>(type: "int", nullable: false),
                    AdminId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AwardedPoints = table.Column<int>(type: "int", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ApprovedRejectedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Posts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Posts_PostStatuses_StatusId",
                        column: x => x.StatusId,
                        principalTable: "PostStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Posts_Users_AdminId",
                        column: x => x.AdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Posts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PointHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AdminId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PointsChange = table.Column<int>(type: "int", nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PointHistories_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PointHistories_Users_AdminId",
                        column: x => x.AdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PointHistories_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Configs", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Configs",
                columns: new[] { "Id", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "GiftPrices", new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc), "{}" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "StreakMilestones", new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc), "{\"50\":{\"color\":\"#4A90E2\",\"emoji\":\"🐢\",\"name\":\"Linh vật xanh dương\"},\"100\":{\"color\":\"#FFD700\",\"emoji\":\"🌟\",\"name\":\"Linh vật vàng\"}}" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "ActionRewards", new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc), "{\"default\":{\"streak\":1,\"ecoTokens\":10},\"tags\":{\"xe-dap\":{\"streak\":1,\"ecoTokens\":15},\"mang-coc\":{\"streak\":1,\"ecoTokens\":12},\"trong-cay\":{\"streak\":1,\"ecoTokens\":20},\"phan-loai-rac\":{\"streak\":1,\"ecoTokens\":12},\"binh-nuoc\":{\"streak\":1,\"ecoTokens\":10},\"tui-vai\":{\"streak\":1,\"ecoTokens\":10}}}" }
                });

            migrationBuilder.InsertData(
                table: "Items",
                columns: new[] { "Id", "ImageUrl", "Name", "RequiredPoints", "Tag" },
                values: new object[,]
                {
                    { new Guid("e2b1a8c0-4e3d-4b7f-8c9a-6f2e0d1b4c5a"), "/imagesItem/4cf97def-f0ef-4a06-899d-dbffa4e2f02f.jpg", "Túi xách vải ", 500, "handmade" },
                    { new Guid("d7a5f4b3-2c1e-4a9d-9b8c-3f0a7e6d5b4c"), "/imagesItem/af1c1380-7edc-40cf-afd1-95b6f8b6d91e.jpg", "Bình nước Thân thiện Môi trường", 1000, "handmade" },
                    { new Guid("c1e9d8a7-b6f5-4e3d-2c1b-0a9f8e7d6c5b"), "/imagesItem/6144411c-172b-45d0-abcb-ae714ea825a5.jpg", "Ống hút Tre", 400, "handmade" },
                    { new Guid("ebb8e449-506c-4f12-9bac-15a63edd502f"), "/imagesItem/75e0829b-fb8f-47f1-9977-d0d377aaca9d.jpg", "Set quà tặng bằng tre ", 150, "handmade" },
                    { new Guid("ed322a69-55b6-47c6-909d-2ce26aaf5a11"), "/imagesItem/8e5f5ba6-8d81-4333-842d-292399c4a44c.jpg", "Hộp bút thân thiện với môi trường", 200, "handmade" },
                    { new Guid("046564c4-882e-49c7-bd74-eb38d41ef521"), "/imagesItem/76b61892-6589-4fd1-af0c-9f02311683c9.jpg", "Giá đỡ máy tính bảng bằng tre", 100, "handmade" }
                });

            migrationBuilder.InsertData(
                table: "PostStatuses",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Pending" },
                    { 2, "Approved" },
                    { 3, "Rejected" }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "User" },
                    { 2, "Admin" },
                    { 3, "Moderator" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Address", "CreatedAt", "CurrentPoints", "DateOfBirth", "Gender", "Name", "PasswordHash", "PhoneNumber", "RoleId", "Streak", "Username" },
                values: new object[,]
                {
                    { new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a"), "TP Hồ Chí Minh", new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc).AddTicks(2265), 1500, new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc).AddTicks(2264), "Nam", "Người dùng thử nghiệm", "$2a$11$YxK8vhj1T.F70B.HtsDBIOeFRDz4ONqiJ8uc8Rc32Xwy3Gy3wuCA6", "", 1, 0, "user_test" },
                    { new Guid("f3e09f3d-6a2a-47c1-80f1-622abce815ca"), "TP Hồ Chí Minh", new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc).AddTicks(2209), 99999, new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc).AddTicks(2201), "Nữ", "Quản trị viên Hệ thống", "$2a$11$QOh34GWE1pvJ1QzCEht4leqFoWINZcdFdZWpc9B5PPlmg.oTX3OwO", "", 2, 99999, "admin" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItemsHistory_ItemId",
                table: "ItemsHistory",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemsHistory_UserId",
                table: "ItemsHistory",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PointHistories_AdminId",
                table: "PointHistories",
                column: "AdminId");

            migrationBuilder.CreateIndex(
                name: "IX_PointHistories_PostId",
                table: "PointHistories",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_PointHistories_UserId",
                table: "PointHistories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_AdminId",
                table: "Posts",
                column: "AdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_StatusId",
                table: "Posts",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_UserId",
                table: "Posts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            migrationBuilder.CreateTable(
                name: "Likes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Likes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Likes_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Likes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Comments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comments_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Comments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Likes_PostId_UserId",
                table: "Likes",
                columns: new[] { "PostId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Likes_PostId",
                table: "Likes",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_Likes_UserId",
                table: "Likes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_PostId",
                table: "Comments",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_UserId",
                table: "Comments",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Comments");

            migrationBuilder.DropTable(
                name: "Likes");

            migrationBuilder.DropTable(
                name: "ItemsHistory");

            migrationBuilder.DropTable(
                name: "PointHistories");

            migrationBuilder.DropTable(
                name: "Items");

            migrationBuilder.DropTable(
                name: "Posts");

            migrationBuilder.DropTable(
                name: "PostStatuses");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Configs");
        }
    }
}
