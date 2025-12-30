#!/bin/bash

# ================================================================
# EcoTokenSystem - Production Deployment Script
# Deploys Backend + Frontend + Stories Migration to AWS
# ================================================================

set -e  # Exit on error

echo "🚀 EcoTokenSystem Production Deployment"
echo "========================================"
echo ""

# Get Terraform outputs
cd terraform
echo "📋 Getting AWS infrastructure info..."
ALB_URL=$(terraform output -raw alb_url)
ECR_REPO=$(terraform output -raw ecr_repository_url)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
S3_BUCKET=$(terraform output -raw s3_bucket_name)
UPLOADS_CLOUDFRONT=$(terraform output -raw uploads_cloudfront_domain)
AWS_REGION="us-east-1"

echo "✅ Infrastructure Info:"
echo "   Backend URL: $ALB_URL"
echo "   ECR Repo: $ECR_REPO"
echo "   CloudFront ID: $CLOUDFRONT_ID"
echo "   S3 Bucket: $S3_BUCKET"
echo "   Uploads CDN: $UPLOADS_CLOUDFRONT"
echo ""

cd ..

# ================================================================
# STEP 1: Build and Deploy Backend with Stories Migration
# ================================================================
echo "🔨 STEP 1: Building Backend Docker Image..."
echo "============================================"

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPO

# Build backend image
echo "🏗️ Building Docker image..."
docker build -t ecotokensystem-backend:latest -f EcoTokenSystem/Dockerfile .

# Tag image
echo "🏷️ Tagging image..."
docker tag ecotokensystem-backend:latest $ECR_REPO:latest

# Push to ECR
echo "⬆️ Pushing to ECR..."
docker push $ECR_REPO:latest

echo "✅ Backend image pushed to ECR"
echo ""

# ================================================================
# STEP 2: Update ECS Service (Deploy Backend)
# ================================================================
echo "🚢 STEP 2: Deploying Backend to ECS..."
echo "======================================="

# Force new deployment
echo "♻️ Forcing ECS service update..."
aws ecs update-service \
  --cluster ecotokensystem-cluster \
  --service ecotokensystem-backend-service \
  --force-new-deployment \
  --region $AWS_REGION

echo "⏳ Waiting for ECS service to stabilize (this may take 2-3 minutes)..."
aws ecs wait services-stable \
  --cluster ecotokensystem-cluster \
  --services ecotokensystem-backend-service \
  --region $AWS_REGION

echo "✅ Backend deployed successfully"
echo ""

# ================================================================
# STEP 3: Run Database Migration
# ================================================================
echo "🗄️ STEP 3: Running Database Migration..."
echo "========================================="

# Get running task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster ecotokensystem-cluster \
  --service-name ecotokensystem-service \
  --region $AWS_REGION \
  --query 'taskArns[0]' \
  --output text)

if [ "$TASK_ARN" = "None" ] || [ -z "$TASK_ARN" ]; then
  echo "❌ No running ECS task found. Deployment may have failed."
  exit 1
fi

echo "📦 Running migration in task: $TASK_ARN"

# Run migration command in ECS task
aws ecs execute-command \
  --cluster ecotokensystem-cluster \
  --task $TASK_ARN \
  --container ecotokensystem-backend \
  --command "dotnet ef database update --project /app/EcoTokenSystem.Infrastructure/EcoTokenSystem.Infrastructure.csproj" \
  --interactive \
  --region $AWS_REGION || echo "⚠️ Migration command may need manual run. Check ECS logs."

echo "✅ Migration executed (check ECS logs for confirmation)"
echo ""

# ================================================================
# STEP 4: Build Frontend with Correct CloudFront URL
# ================================================================
echo "🎨 STEP 4: Building Frontend..."
echo "================================"

cd Frontend

# Set environment variable for backend API URL
export VITE_API_BASE_URL="$ALB_URL/api"

echo "🔧 Building with API URL: $VITE_API_BASE_URL"

# Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm packages..."
  npm install
fi

# Build frontend
echo "🏗️ Building production bundle..."
VITE_API_BASE_URL=$ALB_URL/api npm run build

echo "✅ Frontend build complete"
echo ""

# ================================================================
# STEP 5: Deploy Frontend to S3
# ================================================================
echo "☁️ STEP 5: Deploying Frontend to S3..."
echo "======================================="

# Sync to S3
echo "⬆️ Uploading to S3 bucket: $S3_BUCKET"
aws s3 sync dist/ s3://$S3_BUCKET/ --delete --region $AWS_REGION

echo "✅ Frontend uploaded to S3"
echo ""

# ================================================================
# STEP 6: Invalidate CloudFront Cache
# ================================================================
echo "🔄 STEP 6: Invalidating CloudFront Cache..."
echo "==========================================="

aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*" \
  --region $AWS_REGION

echo "✅ CloudFront cache invalidated"
echo ""

cd ..

# ================================================================
# STEP 7: Verify Deployment
# ================================================================
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "🌐 URLs:"
echo "   Backend API: $ALB_URL/api"
echo "   Frontend: https://d1j604m1z074dh.cloudfront.net"
echo "   Health Check: $ALB_URL/health"
echo ""
echo "🧪 Test Stories Feature:"
echo "   1. Open frontend URL in browser"
echo "   2. Login with existing user"
echo "   3. Go to Social Feed"
echo "   4. Click 'Tạo Story' button"
echo "   5. Upload an image"
echo "   6. Verify story appears in stories list"
echo ""
echo "📊 Verify Backend:"
curl -s "$ALB_URL/health" || echo "⚠️ Health check failed - wait for ECS to fully deploy"
echo ""
echo ""
echo "🔍 Check Deployment Status:"
echo "   Backend Logs: aws logs tail /ecs/ecotokensystem-backend --follow --region $AWS_REGION"
echo "   ECS Service: aws ecs describe-services --cluster ecotokensystem-cluster --services ecotokensystem-service --region $AWS_REGION"
echo "   Database: Check RDS console for Stories table"
echo ""
echo "🎉 Deployment script finished!"
