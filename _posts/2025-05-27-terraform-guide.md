---
layout: post
title: "Terraform Basics: What It Is and Why I Started Using It"
date: 2025-08-01
categories: [terraform]
tags: [terraform, infrastructure-as-code, aws]
image: /assets/images/terraform.jpg
---

## Introduction

When I first started working with cloud infrastructure, most of the setup was done manually using the cloud console. Creating VPCs, EC2 instances, security groups and repeating the same steps for different environments worked initially, but it quickly became difficult to manage.

As the number of environments increased, consistency became a real challenge. This is when I started looking for a better and more reliable way to manage infrastructure—and that’s how I was introduced to **Terraform**.

This post is part of my **Terraform beginner series**, where I will explain Terraform from my own learning and hands-on experience.

---

## What is Terraform?

Terraform is an **Infrastructure as Code (IaC)** tool developed by **HashiCorp**. It allows us to define, provision and manage infrastructure using code instead of manual steps.

Infrastructure is written using **HCL (HashiCorp Configuration Language)**, where we describe the *desired state* of resources. Terraform then figures out how to create or update infrastructure to match that desired state.

One thing I found useful early on is that Terraform is **cloud-agnostic**. The same tool can be used to manage infrastructure across AWS, Azure, GCP and even on-prem environments.

---

## Why I Needed Terraform

The main problem I faced before using Terraform was **lack of consistency**.

Manual infrastructure setup led to:
- Configuration differences between dev and prod
- No clear history of infrastructure changes
- Difficulty in recreating environments
- Time-consuming and repetitive tasks

Terraform solved these problems by allowing infrastructure to be treated like application code—versioned, reviewed and reproducible.

---

## How Terraform Is Used in Real Projects

From my experience, Terraform is commonly used to:

- Provision cloud infrastructure
- Manage multiple environments (dev, stage, prod)
- Standardize infrastructure across teams
- Integrate infrastructure changes into CI/CD pipelines

Once Terraform was introduced, infrastructure changes became more predictable and easier to manage.

---

## A Very Simple Terraform Example

Below is a basic Terraform configuration to create an EC2 instance in AWS:

```hcl
provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "example" {
  ami           = "ami-xxxxxxxx"
  instance_type = "t2.micro"
}
```

After writing this code, running the following command creates the infrastructure:

```bash
terraform apply
```

Terraform takes care of provisioning the resource without any manual steps in the AWS console.

## What I Learned Early

One important concept I learned early is that Terraform follows a declarative approach. Instead of specifying how to create resources, we define what the final infrastructure should look like.

Terraform then handles the execution details, which simplifies infrastructure management significantly.

## Final Thoughts

Terraform is a foundational tool for DevOps engineers and cloud professionals. Starting with the basics helped me build a strong understanding before moving on to advanced topics like modules, state management, and Kubernetes.

In the next post, I will cover Terraform installation and basic CLI commands, based on how I actually use them in day-to-day work.
