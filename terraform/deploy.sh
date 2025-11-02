#!/bin/bash

# Terraform Deployment Script for PolyFinance 2025
# This script helps deploy AWS infrastructure using Terraform

set -e

echo "🚀 PolyFinance 2025 - Terraform Deployment Script"
echo "=================================================="
echo ""

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Error: Terraform is not installed"
    echo "   Install Terraform from: https://www.terraform.io/downloads"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed"
    echo "   Install AWS CLI from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS credentials not configured"
    echo "   Run: aws configure"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "⚠️  Warning: terraform.tfvars not found"
    echo "   Copying terraform.tfvars.example to terraform.tfvars"
    cp terraform.tfvars.example terraform.tfvars
    echo "   Please edit terraform.tfvars with your values before proceeding"
    echo ""
    read -p "Press Enter to continue after editing terraform.tfvars..."
fi

echo "📦 Initializing Terraform..."
terraform init

echo ""
echo "📋 Planning infrastructure changes..."
terraform plan -out=tfplan

echo ""
echo "⚠️  Review the plan above carefully"
read -p "Do you want to apply these changes? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    rm -f tfplan
    exit 0
fi

echo ""
echo "🏗️  Applying infrastructure changes..."
terraform apply tfplan

echo ""
echo "✅ Infrastructure deployed successfully!"
echo ""
echo "📊 Getting output values..."
terraform output

echo ""
echo "📝 Next steps:"
echo "   1. Copy the output values above"
echo "   2. Add them to your backend/.env file"
echo "   3. Request Bedrock model access in AWS Console"
echo "   4. Test your AWS integration"
echo ""
echo "🔗 Useful commands:"
echo "   terraform output          - View all outputs"
echo "   terraform output -json    - View outputs as JSON"
echo "   terraform destroy         - Destroy infrastructure"
echo ""

