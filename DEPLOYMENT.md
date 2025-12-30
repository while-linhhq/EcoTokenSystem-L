# EcoTokenSystem - AWS Deployment Guide

Complete guide to deploy EcoTokenSystem on AWS with GitHub Actions CI/CD.

## 📋 Overview

Architecture:
- **Database**: RDS SQL Server Express (db.t3.micro)
- **Backend**: ECS Fargate (.25 vCPU, 512MB)
- **Frontend**: CloudFront + S3
- **CI/CD**: GitHub Actions
- **Cost**: ~$57-80/month

## 🛠 Prerequisites

1. **AWS Account** with IAM user having admin permissions
2. **Terraform** >= 1.0 installed
3. **AWS CLI** v2 installed and configured
4. **GitHub repository** with this code
5. **Domain** (optional, can use ALB DNS)

## 📝 Setup Instructions

### Step 1: Setup AWS Credentials

```bash
# Install AWS CLI (if not installed)
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region name: us-east-1
# Default output format: json
```

### Step 2: Deploy Infrastructure with Terraform

```bash
# Navigate to terraform directory
cd terraform

# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars

# Required changes:
# - db_master_password: Strong password (min 8 chars)
# - jwt_secret: Min 25 characters
# - s3_bucket_name: Globally unique name (e.g., ecotokensystem-frontend-yourname)

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply infrastructure (takes 10-15 minutes)
terraform apply

# Save the outputs - you'll need them later!
```

**Save these Terraform outputs**:
```
rds_endpoint = "ecotokensystem-db.xxx.us-east-1.rds.amazonaws.com:1433"
alb_url = "http://ecotokensystem-alb-xxx.us-east-1.elb.amazonaws.com"
ecr_repository_url = "123456789012.dkr.ecr.us-east-1.amazonaws.com/ecotokensystem-backend"
cloudfront_distribution_id = "E1234ABCDEF"
cloudfront_domain_name = "d123abc.cloudfront.net"
s3_bucket_name = "ecotokensystem-frontend-yourname"
```

### Step 3: Initial Backend Deployment (Manual)

For the first time, deploy backend manually so GitHub Actions has an image to reference:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build Docker image (from project root)
cd ..
docker build -t ecotokensystem-backend:latest -f EcoTokenSystem/Dockerfile .

# Tag image
docker tag ecotokensystem-backend:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/ecotokensystem-backend:latest

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ecotokensystem-backend:latest
```

ECS service will automatically pull the image and start the task. Check status:

```bash
aws ecs describe-services \
  --cluster ecotokensystem-cluster \
  --services ecotokensystem-backend-service
```

### Step 4: Configure GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPx...` |
| `ECR_REPOSITORY` | ECR repo name | `ecotokensystem-backend` |
| `API_URL` | ALB URL (http://...) | `http://ecotokensystem-alb-1085504532.us-east-1.elb.amazonaws.com` |
| `S3_BUCKET` | S3 bucket name | `ecotokensystem` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront ID | `E2O1UIN20NRIHM` |

**All values come from Terraform outputs in Step 2!**

### Step 5: Test CI/CD Pipeline

```bash
# Commit and push to master
git add .
git commit -m "Setup AWS deployment"
git push origin master
```

GitHub Actions will automatically:
1. Build backend Docker image
2. Push to ECR
3. Deploy to ECS
4. Build frontend
5. Upload to S3
6. Invalidate CloudFront cache

Monitor progress: GitHub → Actions tab

### Step 6: Verify Deployment

```bash
# Check backend health
curl http://YOUR_ALB_URL/api/health

# Expected response:
# {"status":"healthy","database":{"status":"connected"}}

# Access frontend
echo "https://YOUR_CLOUDFRONT_DOMAIN"
# Open in browser
```

### Step 7: DNS Configuration (Optional)

If you have a domain, setup DNS:

**Backend (API)**:
- Record Type: CNAME
- Name: `api.yourdomain.com`
- Value: ALB DNS name (from terraform output)

**Frontend**:
- Record Type: CNAME
- Name: `www.yourdomain.com` or `@`
- Value: CloudFront domain name

**Note**: To use custom domain with HTTPS, you need an ACM certificate. Uncomment the HTTPS listener in `terraform/main.tf`.

## 🔐 GitHub Secrets Reference

All secrets needed for CI/CD:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=<from AWS IAM>
AWS_SECRET_ACCESS_KEY=<from AWS IAM>

# ECR
ECR_REPOSITORY=ecotokensystem-backend

# Backend API
API_URL=http://<ALB_DNS_NAME>    # From terraform output: alb_url

# Frontend
S3_BUCKET=<bucket_name>           # From terraform output: s3_bucket_name
CLOUDFRONT_DISTRIBUTION_ID=<id>  # From terraform output: cloudfront_distribution_id
```

## 🚀 Daily Workflow

After setup is complete:

```bash
# Make code changes
git add .
git commit -m "Your changes"
git push origin master

# GitHub Actions deploys automatically!
```

Monitor:
- GitHub Actions: Check workflow status
- AWS ECS: Check task status
- CloudWatch Logs: `/ecs/ecotokensystem-backend`

## 🐛 Troubleshooting

### ECS Tasks Keep Restarting

```bash
# Check logs
aws logs tail /ecs/ecotokensystem-backend --follow

# Common issues:
# - Database connection failed → Check RDS security group
# - Migration failed → Check connection string
# - Container crashed → Check CloudWatch logs
```

### Frontend 404 Errors

```bash
# Verify S3 upload
aws s3 ls s3://your-bucket-name/

# Check CloudFront
aws cloudfront get-distribution --id YOUR_DIST_ID

# Invalidate cache manually
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### GitHub Actions Failed

Check GitHub Actions logs:
1. Go to Actions tab
2. Click on failed workflow
3. Check which step failed
4. Common issues:
   - AWS credentials invalid → Re-check secrets
   - ECR login failed → Check IAM permissions
   - ECS deployment timeout → Check task definition

### Database Connection Issues

```bash
# Test from local machine
sqlcmd -S YOUR_RDS_ENDPOINT -U sa -P YOUR_PASSWORD

# If fails:
# - Check RDS security group allows your IP
# - Verify RDS is running: aws rds describe-db-instances
```

## 💰 Cost Breakdown

Monthly estimates (us-east-1):

| Service | Configuration | Cost |
|---------|--------------|------|
| RDS SQL Server Express | db.t3.micro (1 vCPU, 1GB) | $25 |
| ECS Fargate | 0.25 vCPU, 512MB, 1 task | $7 |
| ALB | 1 load balancer | $18 |
| S3 | ~1GB storage | $0.02 |
| CloudFront | ~10GB/month | $0.85 |
| ECR | ~2GB images | $0.20 |
| Data Transfer | Minimal | $5 |
| **Total** | | **~$56-80/month** |

**Cost Saving Tips**:
- Delete old ECR images: `aws ecr list-images`
- Monitor CloudWatch Logs retention (currently 7 days)
- Use CloudFront cache effectively
- Consider AWS Free Tier (first 12 months)

## 🔄 Updates & Maintenance

### Update Backend Code

```bash
git commit -am "Update backend"
git push origin master
# GitHub Actions deploys automatically
```

### Update Frontend Code

```bash
git commit -am "Update frontend"
git push origin master
# GitHub Actions deploys automatically
```

### Update Infrastructure

```bash
cd terraform
# Edit main.tf or variables.tf
terraform plan
terraform apply
```

### Database Migrations

Auto-migrations run on container startup (existing code in `Program.cs`).

Manual migration:
```bash
# Connect to RDS
sqlcmd -S YOUR_RDS_ENDPOINT -U sa -P YOUR_PASSWORD

# Run SQL commands
```

## 📊 Monitoring

### CloudWatch Logs

```bash
# View recent logs
aws logs tail /ecs/ecotokensystem-backend --follow

# Filter errors
aws logs filter-log-events \
  --log-group-name /ecs/ecotokensystem-backend \
  --filter-pattern "ERROR"
```

### ECS Service Status

```bash
# Check service
aws ecs describe-services \
  --cluster ecotokensystem-cluster \
  --services ecotokensystem-backend-service

# Check tasks
aws ecs list-tasks \
  --cluster ecotokensystem-cluster \
  --service-name ecotokensystem-backend-service
```

### RDS Monitoring

```bash
# Check DB status
aws rds describe-db-instances \
  --db-instance-identifier ecotokensystem-db

# Check CPU/Memory in AWS Console → RDS → Monitoring
```

## 🗑 Cleanup / Destroy

To delete all resources and stop billing:

```bash
# Delete all resources via Terraform
cd terraform
terraform destroy

# Confirm when prompted
# This will delete:
# - RDS database (and all data!)
# - ECS cluster and tasks
# - ALB
# - S3 bucket (frontend files)
# - CloudFront distribution
# - ECR repository (Docker images)
```

**Warning**: Terraform destroy will PERMANENTLY DELETE the database! Backup first if needed.

## 📦 AWS Resources (Current Deployment)

### Account Information
- **AWS Account ID**: `260820061600`
- **AWS Region**: `us-east-1`

### S3 & CloudFront
- **Frontend Bucket**: `ecotokensystem`
- **Frontend CDN**: `d1j604m1z074dh.cloudfront.net` → https://d1j604m1z074dh.cloudfront.net
- **Uploads Bucket**: `ecotokensystem-uploads-260820061600`
- **Uploads CDN**: `d3cbsrjon1d0kj.cloudfront.net` → https://d3cbsrjon1d0kj.cloudfront.net

### Backend Services
- **ALB URL**: http://ecotokensystem-alb-1085504532.us-east-1.elb.amazonaws.com
- **RDS Endpoint**: `ecotokensystem-db.c2bqekuuegbv.us-east-1.rds.amazonaws.com:1433`
- **ECR Repository**: `260820061600.dkr.ecr.us-east-1.amazonaws.com/ecotokensystem-backend`

### Image Storage
**Production URLs**:
- Posts: `https://d3cbsrjon1d0kj.cloudfront.net/posts/{guid}.jpg`
- Items: `https://d3cbsrjon1d0kj.cloudfront.net/items/{guid}.jpg`

**Environment Variables (ECS)**:
```
AWS__Region=us-east-1
AWS__S3BucketName=ecotokensystem-uploads-260820061600
AWS__CloudFrontDomain=d3cbsrjon1d0kj.cloudfront.net
AWS__UseS3Storage=true
```

---

## 📚 Additional Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [AWS RDS SQL Server Pricing](https://aws.amazon.com/rds/sqlserver/pricing/)
- [GitHub Actions AWS Docs](https://github.com/aws-actions)

## 🤝 Support

If you encounter issues:
1. Check CloudWatch Logs
2. Check GitHub Actions logs
3. Review this guide's Troubleshooting section
4. Check AWS Console for resource status

---

**Created**: 2025-12-29
**Cost Estimate**: $57-80/month
**Implementation Time**: 2-3 hours
