terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "chat-product-vpc" }
}

# Subnets
resource "aws_subnet" "public_a" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
}

# RDS (Mongo replacement)
resource "aws_db_instance" "chatdb" {
  identifier          = "chatdb"
  engine              = "mongo"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username            = var.db_user
  password            = var.db_pass
  vpc_security_group_ids = [aws_security_group.db.id]
  skip_final_snapshot = true
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "chat-product-cluster"
}

# Redis ElastiCache
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "chat-redis"
  engine                     = "redis"
  node_type                  = "cache.t3.micro"
  port                       = 6379
  num_cache_clusters         = 1
  parameter_group_name       = "default.redis7"
}

# ALB + WAF
resource "aws_alb" "main" {
  name               = "chat-alb"
  load_balancer_type = "application"
  vpc_id             = aws_vpc.main.id
  security_groups    = [aws_security_group.alb.id]
}

# S3 Backups
resource "aws_s3_bucket" "backups" {
  bucket = "chat-product-backups-${random_string.suffix.result}"
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Outputs
output "db_connection" {
  value = aws_db_instance.chatdb.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "alb_dns" {
  value = aws_alb.main.dns_name
}
