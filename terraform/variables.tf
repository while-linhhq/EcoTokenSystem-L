# ============================================
# AWS CONFIGURATION
# ============================================

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

# ============================================
# RDS CONFIGURATION
# ============================================

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling in GB"
  type        = number
  default     = 50
}

variable "db_master_username" {
  description = "Master username for RDS"
  type        = string
  default     = "sa"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for RDS (min 8 characters)"
  type        = string
  sensitive   = true
}

# ============================================
# ECS CONFIGURATION
# ============================================

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (256 = 0.25 vCPU)"
  type        = string
  default     = "256"
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = string
  default     = "512"
}

# ============================================
# APPLICATION CONFIGURATION
# ============================================

variable "jwt_secret" {
  description = "JWT secret key (minimum 25 characters)"
  type        = string
  sensitive   = true
}

# ============================================
# ECR CONFIGURATION
# ============================================

variable "ecr_repository_name" {
  description = "Name of ECR repository"
  type        = string
  default     = "ecotokensystem-backend"
}

# ============================================
# S3 & CLOUDFRONT CONFIGURATION
# ============================================

variable "s3_bucket_name" {
  description = "Name of S3 bucket for frontend (must be globally unique)"
  type        = string
}

variable "s3_uploads_bucket_name" {
  description = "Name of S3 bucket for user uploads (must be globally unique)"
  type        = string
}

# ============================================
# OPTIONAL: ACM CERTIFICATE
# ============================================

# variable "acm_certificate_arn" {
#   description = "ARN of ACM certificate for HTTPS (optional)"
#   type        = string
#   default     = ""
# }
