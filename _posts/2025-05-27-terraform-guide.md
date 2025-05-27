---
layout: post
title: "Terraform Beginner’s Guide"
date: 2025-05-27 12:00:00 +0000
categories: [Terraform, DevOps]
tags: [terraform, infrastructure-as-code, aws]
---

Welcome to your beginner-friendly guide on **Terraform**.

In this post, we'll explore what Terraform is, how it works, and a simple example to help you get started.

## What is Terraform?

Terraform is an open-source tool by HashiCorp for defining and provisioning infrastructure using a declarative configuration language.

## Why Use Terraform?

- Infrastructure as Code (IaC)
- Consistency and reproducibility
- Works with AWS, Azure, GCP, and more

## Getting Started

Here’s a minimal Terraform example:

```hcl
provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "example" {
  bucket = "my-terraform-bucket"
  acl    = "private"
}
