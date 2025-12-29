---
layout: post
title: "Terraform Drift: Reality in AWS and Azure Environments"
date: 2025-08-16
categories: [terraform]
tags: [terraform, drift, aws, azure]
image: /assets/images/terraform.jpg
---

Terraform drift is unavoidable in real-world environments.

How I Detected Drift

```bash
terraform plan
```
Terraform showed:

```text
~ resource has changed outside of Terraform
```
How I Fixed It

I imported the modified resource back into Terraform:

```bash
terraform state show azurerm_resource.example
terraform import azurerm_resource.example /subscriptions/xxx/resourceGroups/rg
terraform apply
```

Prevention

- Read-only console access
- Scheduled plan-only pipelines
- Clear emergency-change process
