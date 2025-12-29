---
layout: post
title: "Terraform Basics: What I Learned After Breaking Production"
date: 2025-08-01
categories: [terraform]
tags: [terraform, infrastructure-as-code, aws]
image: /assets/images/terraform.jpg
---

Most Terraform blogs start with definitions. My Terraform journey started with failures.

I didn’t truly understand Terraform when I wrote my first `.tf` file.I understood it only after a failed apply blocked production changes.
This post explains Terraform basics, but through real-world lessons I learned while working with AWS and Azure.

## What Is Terraform (In Real Life)

Terraform is an Infrastructure as Code (IaC) tool that allows us to define, provision and manage infrastructure using declarative configuration files.

But in reality, Terraform is:
- A **state management system**
- A **dependency resolver**
- A **change safety mechanism**

I realized this when a small change unexpectedly planned to destroy critical resources.

## My First Terraform Workflow (And Mistakes)

Like most engineers, I started with:

```bash
terraform init
terraform plan
terraform apply
```
Everything worked fine — until it didn’t.

What Went Wrong
- Single state file for everything
- No environment separation
- Manual changes in cloud console

That’s when Terraform taught me its first real lesson: state matters more than syntax.

## Terraform State (The Most Important Concept)

Terraform state is Terraform’s source of truth about your infrastructure.

When state is:
- Wrong → Terraform makes wrong decisions
- Locked → All changes stop
- Lost → Recovery becomes painful

I learned this during a production incident where Terraform failed with:

```text
Error: Error acquiring the state lock
```

That failure made me redesign how we managed state across environments.

## Local vs Remote State

Local state is fine for learning:

```bash
terraform apply
```

Creates:

```text
terraform.tfstate
```

Remote State (Mandatory in production):
- AWS: S3 + DynamoDB
- Azure: Blob Storage + locking

Example AWS backend:

```hcl
backend "s3" {
  bucket         = "terraform-prod-state"
  key            = "network/vpc.tfstate"
  region         = "us-east-1"
  dynamodb_table = "terraform-locks"
}
```

After moving to remote state, failures became isolated instead of global.

## Providers: Terraform’s Bridge to the Cloud

Providers tell Terraform how to talk to AWS, Azure, Kubernetes, etc.

```hcl
provider "aws" {
  region = "us-east-1"
}
```

I learned the importance of providers when I hit this error:

```text
Error: Provider configuration not present
```

That’s when I understood:
Terraform state remembers providers, not just resources.

## Resources vs Data Sources

Resource

Terraform creates or manages it.

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "prod-app-logs"
}
```

Data Source

Terraform reads existing infrastructure.

```hcl
data "aws_vpc" "existing" {
  default = true
}
```

Using data sources helped me avoid:
- Hardcoded IDs
- Cross-account mistakes
- Region mismatches

## Terraform Modules (How We Scaled Safely)

As infrastructure grew, copy-paste became unmanageable.

Modules helped us:
- Standardize infrastructure
- Reduce mistakes
- Enforce best practices

```hcl
module "eks" {
  source       = "./modules/eks"
  cluster_name = "prod-eks"
}
```

Modules also taught me: bad module design can create hidden dependencies, which we later fixed by refactoring.

## Terraform Plan Is Not Optional

Running terraform apply without reading the plan.

```bash
terraform plan
```

This command has saved me from:
- Accidental deletions
- Downtime
- Irreversible mistakes

In production, plan reviews are mandatory.

## Terraform Is Not Everything

Some misconceptions:
- Terraform is not a deployment tool
- Terraform is not a configuration manager
- Terraform should not manage secrets directly

That’s why we pair it with:
- GitOps (Argo CD)
- Secret managers (AWS Secrets Manager, Azure Key Vault)

## Final Thoughts

- Terraform basics are easy to learn. Using Terraform in production that’s when the real learning happens.
- Every failure made me a better engineer, a safer operator, and a smarter problem solver.
  
This post lays the foundation for my Terraform series, where I share what really breaks and how to fix it.
