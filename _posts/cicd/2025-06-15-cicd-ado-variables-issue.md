---
layout: post
title: "Variables Looked Correct in Azure DevOps, But the Wrong Values Were Used"
description: "A real-world Azure DevOps pipeline issue where variables appeared correct in the UI, but incorrect values were used during deployment, and how I fixed it."
date: 2025-06-15 12:00:00 +0000
categories: [cicd]
tags: [cicd, azure-devops, variables, variable-groups, devops]
image: /assets/images/devops1.jpg
permalink: /cicd/azure-devops-variables-looked-correct-wrong-values-used/
---

All variables in Azure DevOps looked correct in the UI, but during deployment the application picked up wrong values.  
The root cause was a variable precedence issue combined with variable group overrides.

While working with Azure DevOps YAML pipelines, we were deploying the same application to multiple environments:
- Dev  
- QA  
- Prod  

Each environment had its own:
- Variable groups
- Secrets
- Config values  

The pipeline ran successfully and showed expected values in the Variables tab but the deployed application behaved as if it was using a different configuration.

The Problem

After deployment:
- The application connected to the **wrong database**
- Feature flags behaved unexpectedly
- Environment-specific values didn’t match what we saw in Azure DevOps

From the UI:
> Variables looked perfect 

From runtime:
> Completely wrong

Even though variables appeared correct:
- Some values were overridden at runtime
- Others were coming from unexpected sources
- The pipeline never failed

This made the issue hard to detect and easy to misinterpret.

How I Investigated the Issue

Step 1: Printed Variables During Deployment
I added a debug step:
```yaml
- script: |
    echo "ENVIRONMENT=$(ENVIRONMENT)"
    echo "DB_HOST=$(DB_HOST)"
```
The output did not match the Variables tab. That confirmed the problem was real.

Step 2: Checked Variable Groups
I discovered:
- Multiple variable groups were linked to the pipeline
- The same variable name existed in more than one group
- Azure DevOps used the last linked variable group silently

Step 3: Checked Variable Definitions in YAML
Some variables were also defined inside the pipeline:
```yaml
variables:
  ENVIRONMENT: dev
```
These overrode UI values, depending on scope and timing.

Step 4: Checked Variable Scope
We found variables defined at:
- Pipeline level
- Stage level
- Job level
Lower-level scopes silently override higher-level variables.

Root Cause

Azure DevOps resolves variables using precedence rules:
- Job-level variables
- Stage-level variables
- Pipeline YAML variables
- Variable groups
- UI-defined variables
When:
- Variable names are reused
- Variable groups overlap
- YAML variables exist

Azure DevOps does exactly what it’s designed to do, but not what you expect.

The Fixes That Worked

Fix 1: Use Unique Variable Names per Environment
Instead of:
```text
DB_HOST
```
Use
```text
DEV_DB_HOST
PROD_DB_HOST
```

Fix 2: Avoid Redefining Variables in YAML
Removed hardcoded values like:
```yaml
variables:
  ENVIRONMENT: dev
```
And passed environment explicitly via parameters.

Fix 3: Link Only Required Variable Groups
Each environment pipeline now links only one variable group. No shared or overlapping groups.

Fix 4: Log Critical Variables (Safely)
For non-secret values:
```yaml
- script: echo "Running in $(ENVIRONMENT)"
```
For secrets, log hash or presence, not value.

Fix 5: Use Runtime Parameters for Environments
```yaml
parameters:
- name: environment
  type: string
  values:
    - dev
    - qa
    - prod
```
This made environment selection explicit and predictable.

Best Practices to Avoid This Issue
- Never reuse variable names across variable groups
- Prefer parameters over variables for environments
- Avoid mixing UI variables and YAML variables
- Keep variable scope minimal
- Log important config values during deployment

This incident reinforced a subtle but critical lesson:
What you see in Azure DevOps UI is not always what your pipeline uses. Understanding variable precedence is essential for safe deployments.

## Final Thoughts
Variables are powerful and dangerous when misused. If your application behaves unexpectedly after a “successful” pipeline, variables should be your first suspect. Build pipelines that make configuration obvious, explicit and auditable.
