---
layout: post
title: "Terraform State Locking: A Real Production Incident"
date: 2025-08-03
categories: [terraform]
tags: [terraform, state, locking, aws, azure]
image: /assets/images/terraform.jpg
permalink: /terraform/terraform-state-locking-production-incident/
---

Terraform state locking is something most engineers underestimate until it blocks production.

What Happened

A CI pipeline failed during `terraform apply`. The remote state (S3 + DynamoDB) remained locked.
All further deployments were blocked.

```text
Error: ConditionalCheckFailedException: The conditional request failed
Lock Info:
  ID: 2a9c1234
  Operation: OperationTypeApply
  Who: ci-pipeline
```

How I Investigated

Before touching the lock, I confirmed:
- No active pipeline was running
- No manual Terraform execution was in progress

```bash
terraform plan
```
Fixing the Issue Safely

After validation, I unlocked the state:

```bash
terraform force-unlock 2a9c1234
```
Then re-applied:

```bash
terraform plan
terraform apply
```
AWS Backend Example

```hcl
backend "s3" {
  bucket         = "terraform-prod-state"
  key            = "vpc/main.tfstate"
  region         = "us-east-1"
  dynamodb_table = "terraform-locks"
}
```

Preventive Measures

- Serialized Terraform applies
- CI checks to prevent parallel runs
- Clear ownership of state

## Lesson Learned

Force-unlocking without validation can corrupt state and cause outages.
