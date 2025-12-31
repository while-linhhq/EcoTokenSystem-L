terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Optional: Remote state in S3
  # backend "s3" {
  #   bucket         = "ecotokensystem-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region
}

# ============================================
# DATA SOURCES - Use Default VPC
# ============================================

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_caller_identity" "current" {}

# ============================================
# SECURITY GROUPS
# ============================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "ecotokensystem-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecotokensystem-alb-sg"
  }
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name        = "ecotokensystem-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecotokensystem-ecs-tasks-sg"
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "ecotokensystem-rds-sg"
  description = "Security group for RDS SQL Server"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "SQL Server from ECS tasks"
    from_port       = 1433
    to_port         = 1433
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecotokensystem-rds-sg"
  }
}

# ============================================
# RDS SQL SERVER
# ============================================

resource "aws_db_subnet_group" "main" {
  name       = "ecotokensystem-db-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "ecotokensystem-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "ecotokensystem-db"
  engine         = "sqlserver-ex"
  engine_version = "15.00"  # SQL Server 2019 Express
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = null  # SQL Server doesn't use this parameter
  username = var.db_master_username
  password = var.db_master_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  multi_az               = false  # Single-AZ for cost savings
  backup_retention_period = 1    # Minimum backup retention
  skip_final_snapshot    = true

  # Maintenance window
  maintenance_window = "sun:04:00-sun:05:00"
  backup_window      = "03:00-04:00"

  enabled_cloudwatch_logs_exports = ["error"]

  tags = {
    Name = "ecotokensystem-db"
  }
}

# ============================================
# ECR REPOSITORY
# ============================================

resource "aws_ecr_repository" "backend" {
  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "ecotokensystem-backend"
  }
}

# ============================================
# ECS CLUSTER
# ============================================

resource "aws_ecs_cluster" "main" {
  name = "ecotokensystem-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = {
    Name = "ecotokensystem-cluster"
  }
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/ecotokensystem-backend"
  retention_in_days = 3

  tags = {
    Name = "ecotokensystem-ecs-logs"
  }
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution_role" {
  name = "ecotokensystem-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "ecotokensystem-ecs-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role (for application permissions)
resource "aws_iam_role" "ecs_task_role" {
  name = "ecotokensystem-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "ecotokensystem-ecs-task-role"
  }
}

# IAM policy for S3 uploads access
resource "aws_iam_policy" "s3_uploads_access" {
  name        = "ecotokensystem-s3-uploads-access"
  description = "Allow ECS tasks to read/write/delete from uploads bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.uploads.arn}",
          "${aws_s3_bucket.uploads.arn}/*"
        ]
      }
    ]
  })
}

# Attach policy to ECS task role
resource "aws_iam_role_policy_attachment" "ecs_task_role_s3_uploads" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.s3_uploads_access.arn
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "ecotokensystem-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "ecotokensystem-backend"
      image = "${aws_ecr_repository.backend.repository_url}:latest"

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "ASPNETCORE_ENVIRONMENT"
          value = "Production"
        },
        {
          name  = "ASPNETCORE_URLS"
          value = "http://+:8080"
        },
        {
          name  = "ConnectionStrings__DefaultConnection"
          value = "Server=${aws_db_instance.main.address};Database=EcoTokenDatabase;User Id=${var.db_master_username};Password=${var.db_master_password};TrustServerCertificate=True;MultipleActiveResultSets=true"
        },
        {
          name  = "JwtSettings__Secret"
          value = var.jwt_secret
        },
        {
          name  = "JwtSettings__Issuer"
          value = "EcoTokenSystemAPI"
        },
        {
          name  = "JwtSettings__Audience"
          value = "EcoTokenSystemUsers"
        },
        {
          name  = "JwtSettings__ExpiryMinutes"
          value = "60"
        },
        {
          name  = "AWS__Region"
          value = var.aws_region
        },
        {
          name  = "AWS__S3BucketName"
          value = aws_s3_bucket.uploads.id
        },
        {
          name  = "AWS__CloudFrontDomain"
          value = aws_cloudfront_distribution.uploads.domain_name
        },
        {
          name  = "AWS__UseS3Storage"
          value = "true"
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/api/health || exit 1"]
        interval    = 30
        timeout     = 15       # Increased from 5 to 15 - allow time for DB queries
        retries     = 5        # Increased from 3 to 5 - more tolerant of transient issues
        startPeriod = 120      # Increased from 60 to 120 - more time for startup/migrations
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "ecotokensystem-backend"
  }
}

# ============================================
# APPLICATION LOAD BALANCER
# ============================================

resource "aws_lb" "main" {
  name               = "ecotokensystem-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default.ids

  enable_deletion_protection = false

  tags = {
    Name = "ecotokensystem-alb"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "ecotokensystem-backend-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    protocol            = "HTTP"
    port                = "8080"
    healthy_threshold   = 2
    unhealthy_threshold = 10     # Increased from 5 to 10 - more tolerant of slow DB queries
    timeout             = 20     # Increased from 10 to 20 - allow time for database check
    interval            = 30
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "ecotokensystem-backend-tg"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# Optional: HTTPS listener (requires ACM certificate)
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = "443"
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-2016-08"
#   certificate_arn   = var.acm_certificate_arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.backend.arn
#   }
# }

# ============================================
# ECS SERVICE
# ============================================

resource "aws_ecs_service" "backend" {
  name            = "ecotokensystem-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1  # Single task for cost optimization
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true  # Required for pulling from ECR without NAT Gateway
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "ecotokensystem-backend"
    container_port   = 8080
  }

  deployment_minimum_healthy_percent = 0    # Allow downtime during deployment for cost savings
  deployment_maximum_percent         = 100  # Only 1 task maximum

  health_check_grace_period_seconds = 240   # 4 minutes for database migrations and startup

  depends_on = [aws_lb_listener.http]

  tags = {
    Name = "ecotokensystem-backend-service"
  }
}

# ============================================
# S3 BUCKET FOR FRONTEND
# ============================================

resource "aws_s3_bucket" "frontend" {
  bucket = var.s3_bucket_name

  tags = {
    Name = "ecotokensystem-frontend"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # SPA routing
  }
}

# ============================================
# CLOUDFRONT DISTRIBUTION
# ============================================

resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "OAI for EcoTokenSystem frontend"
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "EcoTokenSystem Frontend Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"  # Cheapest: US, Canada, Europe

  # S3 origin for frontend static files
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  # ALB origin for backend API (proxy to avoid mixed content)
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default behavior: serve frontend from S3
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  # API behavior: proxy /api/* and other backend routes to ALB
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-backend"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "Accept"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  # SPA routing: redirect 404 to index.html
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    # Use ACM certificate if you have a custom domain:
    # acm_certificate_arn      = var.acm_certificate_arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "ecotokensystem-frontend"
  }
}

# ============================================
# OUTPUTS
# ============================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "ALB URL"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = aws_s3_bucket.frontend.id
}

# ============================================
# S3 BUCKET FOR USER UPLOADS (Images)
# ============================================

resource "aws_s3_bucket" "uploads" {
  bucket = var.s3_uploads_bucket_name

  tags = {
    Name = "ecotokensystem-uploads"
  }
}

# Block public access - only via CloudFront
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning (data protection)
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Suspended"  # Suspended for cost optimization
  }
}

# CORS for uploads bucket
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# CloudFront OAI for uploads
resource "aws_cloudfront_origin_access_identity" "uploads" {
  comment = "OAI for EcoTokenSystem uploads"
}

# S3 bucket policy - allow CloudFront
resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.uploads.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      }
    ]
  })
}

# CloudFront distribution for uploads
resource "aws_cloudfront_distribution" "uploads" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "EcoTokenSystem Uploads CDN"
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.uploads.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.uploads.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.uploads.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400      # 1 day
    max_ttl                = 31536000   # 1 year
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "ecotokensystem-uploads-cdn"
  }
}

output "s3_uploads_bucket_name" {
  description = "S3 bucket name for uploads"
  value       = aws_s3_bucket.uploads.id
}

output "uploads_cloudfront_domain" {
  description = "CloudFront domain for uploads"
  value       = aws_cloudfront_distribution.uploads.domain_name
}
