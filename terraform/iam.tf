# IAM Role for OpenSearch Master User (if enabled)
resource "aws_iam_role" "opensearch_master" {
  count = var.opensearch_master_enabled && var.create_iam_roles ? 1 : 0

  name = "${var.project_name}-opensearch-master"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "opensearch.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-opensearch-master-role"
  }
}

# IAM Role for Application Services
resource "aws_iam_role" "application_role" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.project_name}-application-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-application-role"
  }
}

# IAM Policy for S3 Access
resource "aws_iam_role_policy" "s3_access" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.project_name}-s3-access"
  role = aws_iam_role.application_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.regulatory_docs.arn,
          "${aws_s3_bucket.regulatory_docs.arn}/*"
        ]
      }
    ]
  })
}

# IAM Policy for Textract Access
resource "aws_iam_role_policy" "textract_access" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.project_name}-textract-access"
  role = aws_iam_role.application_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "textract:DetectDocumentText",
          "textract:AnalyzeDocument",
          "textract:StartDocumentTextDetection",
          "textract:StartDocumentAnalysis",
          "textract:GetDocumentTextDetection",
          "textract:GetDocumentAnalysis"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for Comprehend Access
resource "aws_iam_role_policy" "comprehend_access" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.project_name}-comprehend-access"
  role = aws_iam_role.application_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "comprehend:DetectEntities",
          "comprehend:DetectKeyPhrases",
          "comprehend:DetectSentiment",
          "comprehend:DetectDominantLanguage",
          "comprehend:BatchDetectEntities",
          "comprehend:BatchDetectKeyPhrases",
          "comprehend:BatchDetectSentiment",
          "comprehend:BatchDetectDominantLanguage"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for Bedrock Access
resource "aws_iam_role_policy" "bedrock_access" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.project_name}-bedrock-access"
  role = aws_iam_role.application_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:ListFoundationModels",
          "bedrock:GetFoundationModel"
        ]
        Resource = [
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-*",
          "arn:aws:bedrock:*::foundation-model/*"
        ]
      }
    ]
  })
}

# IAM Policy for OpenSearch Access
resource "aws_iam_role_policy" "opensearch_access" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.project_name}-opensearch-access"
  role = aws_iam_role.application_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "es:ESHttpPost",
          "es:ESHttpPut",
          "es:ESHttpGet",
          "es:ESHttpDelete",
          "es:DescribeElasticsearchDomain",
          "es:ListDomainNames",
          "es:DescribeDomain",
          "es:DescribeDomainConfig"
        ]
        Resource = [
          aws_opensearch_domain.regulatory_search.arn,
          "${aws_opensearch_domain.regulatory_search.arn}/*"
        ]
      }
    ]
  })
}

# IAM Policy for CloudWatch Logs (for OpenSearch)
resource "aws_iam_role_policy" "cloudwatch_logs" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.project_name}-cloudwatch-logs"
  role = aws_iam_role.application_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.opensearch.arn}:*"
      }
    ]
  })
}

