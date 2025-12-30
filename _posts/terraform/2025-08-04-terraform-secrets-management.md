---
layout: post
title: "Terraform Secrets Management: Azure Key Vault and AWS Secrets Manager"
date: 2025-08-04
categories: [terraform, security]
tags: [terraform, secrets, keyvault, aws]
image: /assets/images/terraform.jpg
permalink: /terraform/secrets
---

Secrets management is where Terraform mistakes turn into security incidents.

The Initial Mistake

Secrets were passed via `.tfvars`.

```text
Error: Sensitive value used in non-sensitive context
```
This exposed the risk of leaking secrets via state or logs.

Correct Workflow

Azure

```bash
az login
terraform init
terraform plan
terraform apply
```
AWS

```bash
aws configure
terraform init
terraform plan
terraform apply
```
How I Fixed It

- Moved secrets fully to Azure Key Vault / AWS Secret Manager
- Terraform only referenced secret IDs
- Marked outputs as sensitive
- Restricted backend access

Why This Design Matters

- Terraform state can still contain sensitive data.
- Securing the backend is just as important as securing the code.

Fetching Secrets (AWS Example)

```hcl
data "aws_secretsmanager_secret_version" "db" {
  secret_id = "prod/db/password"
}
```
State Inspection (Important)

```bash
terraform state show aws_db_instance.example
```
Even sensitive values can appear in state → backend must be secure.

## Final Outcome

- No secrets in Git
- No secrets in pipelines
- Passed security reviews
