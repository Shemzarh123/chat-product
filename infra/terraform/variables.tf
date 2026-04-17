variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_user" {
  type = string
}

variable "db_pass" {
  type = string
}
