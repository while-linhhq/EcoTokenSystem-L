
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# BƯỚC 2: Đặt thư mục làm việc
# -------------------------------------------
# WORKDIR = "Thư mục làm việc" - giống như cd vào thư mục này
# Tất cả lệnh sau sẽ chạy trong thư mục /src
WORKDIR /src

# BƯỚC 3: Copy các file .csproj và restore dependencies
# -------------------------------------------
# Tại sao copy .csproj trước? 
# → Docker cache từng bước. Nếu code thay đổi nhưng .csproj không đổi,
#   Docker sẽ dùng lại cache của bước restore, tiết kiệm thời gian!
COPY ["EcoTokenSystem/EcoTokenSystem.API.csproj", "EcoTokenSystem/"]
COPY ["EcoTokenSystem.Application/EcoTokenSystem.Application.csproj", "EcoTokenSystem.Application/"]
COPY ["EcoTokenSystem.Domain/EcoTokenSystem.Domain.csproj", "EcoTokenSystem.Domain/"]
COPY ["EcoTokenSystem.Infrastructure/EcoTokenSystem.Infrastructure.csproj", "EcoTokenSystem.Infrastructure/"]

# Restore = Tải về tất cả các package (thư viện) cần thiết
# Ví dụ: EntityFramework, JWT, BCrypt, v.v.
RUN dotnet restore "EcoTokenSystem/EcoTokenSystem.API.csproj"

# BƯỚC 4: Copy toàn bộ source code
# -------------------------------------------
# COPY . . = Copy tất cả file từ thư mục hiện tại (.) vào thư mục hiện tại trong container (.)
# Bây giờ Docker đã có đầy đủ code để build
COPY . .

# BƯỚC 5: Build ứng dụng
# -------------------------------------------
# Chuyển vào thư mục EcoTokenSystem
WORKDIR "/src/EcoTokenSystem"

# Build = Biên dịch code C# thành file .dll (giống như compile)
# -c Release = Build ở chế độ Release (tối ưu, không có debug info)
# -o /app/build = Output (kết quả) đặt vào /app/build
RUN dotnet build "EcoTokenSystem.API.csproj" -c Release -o /app/build

# BƯỚC 6: Publish ứng dụng
# -------------------------------------------
# Publish = Tạo bản deploy cuối cùng (chỉ có file cần thiết để chạy)
# FROM build = Vẫn dùng stage "build" ở trên
FROM build AS publish

# Publish ứng dụng
# /app/publish = Nơi chứa file đã publish
RUN dotnet publish "EcoTokenSystem.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# BƯỚC 7: Tạo runtime image (image cuối cùng để chạy)
# -------------------------------------------
# aspnet:8.0 = Image nhẹ hơn, chỉ có runtime (không có SDK)
# Tại sao? Vì khi chạy app, ta không cần SDK nữa, chỉ cần runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

# Cài curl cho ECS health check
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Đặt thư mục làm việc
WORKDIR /app

# EXPOSE = Thông báo container sẽ lắng nghe trên port này
# 8080 = Port HTTP
EXPOSE 8080

# BƯỚC 8: Copy file đã publish vào runtime image
# -------------------------------------------
# --from=publish = Lấy file từ stage "publish" ở trên
# /app/publish = Nơi chứa file trong stage publish
# . = Copy vào thư mục hiện tại (WORKDIR /app)
COPY --from=publish /app/publish .

# BƯỚC 9: Cấu hình môi trường
# -------------------------------------------
# ENV = Environment Variable (biến môi trường)
# ASPNETCORE_URLS = Port mà ứng dụng sẽ lắng nghe
# http://+:8080 = Lắng nghe trên tất cả interface, port 8080
ENV ASPNETCORE_URLS=http://+:8080

# BƯỚC 10: Chạy ứng dụng
# -------------------------------------------
# ENTRYPOINT = Lệnh chạy khi container khởi động
# dotnet EcoTokenSystem.API.dll = Chạy file .dll đã build
ENTRYPOINT ["dotnet", "EcoTokenSystem.API.dll"]

