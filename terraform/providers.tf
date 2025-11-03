terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configure backend in terraform.tfvars or use local backend
    # bucket = "your-terraform-state-bucket"
    # key    = "intellirisk/terraform.tfstate"
    # region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "IntelliRisk"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

