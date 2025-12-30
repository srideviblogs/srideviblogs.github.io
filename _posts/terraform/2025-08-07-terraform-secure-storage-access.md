---
layout: post
title: "Secure Azure Storage Access from ACI Using SAS Tokens"
date: 2025-08-07
categories: [terraform]
tags: [terraform, aci, storage, security]
image: /assets/images/terraform.jpg
permalink: /terraform/security
---

Secure service-to-service access is a common production challenge.

Scenario

Azure Container Instances needed access to Blob Storage without exposing credentials.

Terraform Apply Flow

```bash
terraform init
terraform plan
terraform apply
```

Error I Encountered

```text
AuthorizationFailure: This request is not authorized to perform this operation
```

How I Fixed It

- Regenerated SAS token
- Reduced permissions
- Set shorter expiry

## Security Lesson

Time-bound access is safer than permanent credentials.
