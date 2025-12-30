---
layout: post
title: "Terraform and GitOps: Argo CD with AKS and Keycloak"
date: 2025-06-10
categories: [terraform]
tags: [terraform, argocd, aks, keycloak]
image: /assets/images/terraform.jpg
permalink: /terraform/argocd
---

Terraform works best when it focuses on infrastructure provisioning, not application lifecycle management.

Use Case

We implemented SSO for Argo CD using Keycloak.
Terraform provisioned cloud resources and secrets, while Argo CD handled workloads.

Design Choice

Terraform created:
- Azure resources
- Key Vault secrets
- AKS dependencies

Terraform Workflow

```bash
terraform init
terraform plan
terraform apply
```

After infrastructure provisioning, Argo CD handled application sync:

```bash
argocd app create
argocd app sync
```

Error We Encountered

```text
rpc error: code = Unauthenticated desc = invalid client secret
```
Root Cause

The Key Vault secret was rotated but Kubernetes secrets were not updated.

Fix

We refreshed secrets using Terraform and re-synced Argo CD.
Secrets were rotated → Terraform reapplied → Argo CD resynced.

## Lesson

- Terraform provisions infrastructure.
- GitOps tools manage applications.
