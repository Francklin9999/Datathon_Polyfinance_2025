# S3 Outputs
output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.regulatory_docs.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.regulatory_docs.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.regulatory_docs.bucket_domain_name
}

# OpenSearch Outputs
output "opensearch_domain_id" {
  description = "ID of the OpenSearch domain"
  value       = aws_opensearch_domain.regulatory_search.domain_id
}

output "opensearch_domain_arn" {
  description = "ARN of the OpenSearch domain"
  value       = aws_opensearch_domain.regulatory_search.arn
}

output "opensearch_domain_endpoint" {
  description = "Endpoint of the OpenSearch domain"
  value       = aws_opensearch_domain.regulatory_search.endpoint
}

output "opensearch_dashboard_endpoint" {
  description = "Kibana dashboard endpoint"
  value       = aws_opensearch_domain.regulatory_search.dashboard_endpoint
}

# IAM Outputs
output "application_role_arn" {
  description = "ARN of the application IAM role"
  value       = var.create_iam_roles ? aws_iam_role.application_role[0].arn : null
}

output "opensearch_master_role_arn" {
  description = "ARN of the OpenSearch master IAM role"
  value       = var.opensearch_master_enabled && var.create_iam_roles ? aws_iam_role.opensearch_master[0].arn : null
}

# Configuration Outputs
output "aws_region" {
  description = "AWS region used"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

# Environment Variables for Application
output "env_variables" {
  description = "Environment variables to set in application"
  value = {
    AWS_REGION            = var.aws_region
    S3_BUCKET_NAME        = aws_s3_bucket.regulatory_docs.id
    OPENSEARCH_ENDPOINT   = aws_opensearch_domain.regulatory_search.endpoint
    OPENSEARCH_INDEX      = "regulatory-documents"
    OPENSEARCH_DASHBOARD  = aws_opensearch_domain.regulatory_search.dashboard_endpoint
  }
}

