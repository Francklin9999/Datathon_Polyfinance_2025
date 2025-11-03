variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "intellirisk"
}

# S3 Variables
variable "s3_bucket_name" {
  description = "Name of the S3 bucket for document storage"
  type        = string
  default     = "intellirisk-regulatory-docs"
}

variable "enable_s3_versioning" {
  description = "Enable versioning for S3 bucket"
  type        = bool
  default     = true
}

variable "s3_lifecycle_days" {
  description = "Number of days before moving files to Glacier"
  type        = number
  default     = 90
}

# OpenSearch Variables
variable "opensearch_domain_name" {
  description = "Name of the OpenSearch domain"
  type        = string
  default     = "intellirisk-regulatory-search"
}

variable "opensearch_instance_type" {
  description = "Instance type for OpenSearch cluster"
  type        = string
  default     = "t3.small.search"  # Use t3.small for dev, upgrade for prod
}

variable "opensearch_instance_count" {
  description = "Number of instances in OpenSearch cluster"
  type        = number
  default     = 1
}

variable "opensearch_volume_size" {
  description = "EBS volume size for OpenSearch (GB)"
  type        = number
  default     = 20
}

variable "opensearch_master_enabled" {
  description = "Enable dedicated master nodes"
  type        = bool
  default     = false  # Set to true for production
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access OpenSearch"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Restrict for production
}

# Bedrock Variables
variable "bedrock_model_access" {
  description = "List of Bedrock models to request access for"
  type        = list(string)
  default = [
    "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "anthropic.claude-3-opus-20240229-v1:0",
    "anthropic.claude-3-sonnet-20240229-v1:0"
  ]
}

# IAM Variables
variable "create_iam_roles" {
  description = "Create IAM roles for services"
  type        = bool
  default     = true
}

