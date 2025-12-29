---
layout: post
title: "Terraform State Design: Reducing Blast Radius in AKS and EKS"
date: 2025-08-02
categories: [terraform]
tags: [terraform, state, aks, eks, devops]
image: /assets/images/terraform.jpg
---

When I started managing Kubernetes clusters (AKS and later EKS) using Terraform, I realized something critical:
Terraform state design matters more than resource definitions.

A poorly designed state can turn a small change into a production outage.

Initially, Kubernetes cluster, networking, IAM and monitoring resources were all managed under a single Terraform state file.

This meant:
- Large plans
- Slow applies
- High blast radius

Any failure affected everything.

How I Applied Terraform

```bash
terraform init
terraform validate
terraform plan
terraform apply
```

During one apply, Terraform failed midway and left the state locked.

```text
Error: Error acquiring the state lock
```

How I Debugged the Issue

I first verified that no other Terraform process was running.
Then I validated the existing state before proceeding.

```bash
terraform state list
terraform plan
```

Then confirm no parallel Terraform execution was running.

I redesigned the setup:

- Separate state per environment
- Separate state per domain (Kubernetes, networking, security)
- Independent pipelines per state

Example (AWS EKS)

```bash
terraform init \
  -backend-config="bucket=tf-prod-state" \
  -backend-config="key=eks/cluster.tfstate"
```

Why This Worked

Failures were isolated
Faster plans
Easier recovery
Lower production risk

## Key Lesson

Terraform state should be treated as a production asset, not an implementation detail.
