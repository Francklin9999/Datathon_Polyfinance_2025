# Main Terraform configuration for PolyFinance 2025 AWS Infrastructure

# This file serves as the entry point and references other modules
# All resources are defined in separate files:
# - s3.tf: S3 bucket configuration
# - opensearch.tf: OpenSearch domain configuration
# - iam.tf: IAM roles and policies
# - outputs.tf: Output values

# Note: The following AWS services are managed services and don't require infrastructure:
# - AWS Textract: No infrastructure needed, just IAM permissions
# - Amazon Comprehend: No infrastructure needed, just IAM permissions
# - Amazon Bedrock: No infrastructure needed, just IAM permissions and model access requests

# For Bedrock model access, you need to:
# 1. Go to AWS Bedrock Console
# 2. Request access to Claude models (Claude 3.5 Sonnet, etc.)
# 3. Wait for approval (usually instant for Claude models)

# Optional: Create a file terraform.tfvars with your values:
# aws_region = "us-east-1"
# environment = "dev"
# s3_bucket_name = "polyfinance-regulatory-docs"
# opensearch_domain_name = "polyfinance-regulatory-search"

