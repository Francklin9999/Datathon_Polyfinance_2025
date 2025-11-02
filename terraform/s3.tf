# S3 Bucket for Document Storage
resource "aws_s3_bucket" "regulatory_docs" {
  bucket = var.s3_bucket_name

  tags = {
    Name        = "${var.project_name}-regulatory-docs"
    Service     = "Document Storage"
    Description = "Stores regulatory documents, 10-K filings, and analysis results"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "regulatory_docs" {
  bucket = aws_s3_bucket.regulatory_docs.id

  versioning_configuration {
    status = var.enable_s3_versioning ? "Enabled" : "Disabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "regulatory_docs" {
  bucket = aws_s3_bucket.regulatory_docs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "regulatory_docs" {
  bucket = aws_s3_bucket.regulatory_docs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls       = true
  restrict_public_buckets  = true
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "regulatory_docs" {
  bucket = aws_s3_bucket.regulatory_docs.id

  rule {
    id     = "transition_to_glacier"
    status = "Enabled"

    transition {
      days          = var.s3_lifecycle_days
      storage_class = "GLACIER"
    }

    expiration {
      days = 3650  # Delete after 10 years
    }

    noncurrent_version_transition {
      days          = 30
      storage_class = "GLACIER"
    }

    noncurrent_version_expiration {
      days = 365
    }
  }

  rule {
    id     = "delete_incomplete_uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 Bucket CORS Configuration (if needed for frontend)
resource "aws_s3_bucket_cors_configuration" "regulatory_docs" {
  bucket = aws_s3_bucket.regulatory_docs.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["*"]  # Restrict to your frontend domain in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket Notification (for future Lambda integration)
resource "aws_s3_bucket_notification" "regulatory_docs" {
  bucket = aws_s3_bucket.regulatory_docs.id

  # Example: Trigger Lambda on file upload
  # lambda_function {
  #   lambda_function_arn = aws_lambda_function.process_document.arn
  #   events              = ["s3:ObjectCreated:*"]
  #   filter_prefix        = "uploads/"
  # }
}

