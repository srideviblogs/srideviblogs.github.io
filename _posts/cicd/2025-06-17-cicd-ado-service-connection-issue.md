---
layout: post
title: "Azure DevOps Service Connection Worked Yesterday, But Not Today"
date: 2025-06-17 12:00:00 +0000
categories: [cicd]
tags: [cicd, azure-devops, service-connection, cicd, permissions, devops]
image: /assets/images/devops1.jpg
permalink: /cicd/azure-devops-service-connection-worked-yesterday-not-today/
---

An Azure DevOps pipeline failed because a service connection that worked perfectly yesterday suddenly stopped working today.  
The root cause was an expired credential and missing permission validation, combined with Azure DevOps delayed failure signals.

We were using Azure DevOps service connections to deploy infrastructure and applications to Azure.
The setup was stable:
- Pipelines were green for weeks
- No code changes
- No pipeline changes

The pipeline failed with errors like:
The service principal does not have authorization to perform this action or sometimes Invalid client secret provided.

The confusing part:
> The same pipeline worked yesterday.

Nothing changed in the pipeline, but something outside Azure DevOps did. That’s what made the issue tricky.

How I Investigated the Issue

Step 1: Verified Service Connection in Azure DevOps
In Project Settings → Service connections:
- Connection status showed Verified
- No obvious errors
This gave a false sense of confidence.

Step 2: Checked Pipeline Logs Carefully
The logs revealed:
- Authentication failures
- Authorization errors
- Token-related issues
This indicated a **credential or permission problem**, not a pipeline issue.

Step 3: Checked Service Principal in Azure AD
In Azure Active Directory → App registrations:
- Service principal’s client secret had expired
- Certificate had reached its validity end date
Azure does not warn before expiration by default.

Step 4: Checked Azure Permissions
In some cases:
- Required roles were removed
- Subscription scope changed
- Resource group permissions were altered
The service principal still existed but with insufficient permissions.

Why This Happened (Root Cause)

Common reasons service connections “randomly” fail:
1. Client secret expired  
2. Certificate expired  
3. Azure role assignment removed  
4. Subscription or tenant changes  
5. Conditional Access policies enforced  
Azure DevOps does not proactively alert on these changes.

The Fixes That Worked

Fix 1: Rotate Client Secret or Certificate
Created a new secret in Azure AD and updated the service connection.
For long-term stability:
- Prefer certificate-based auth
- Use workload identity federation

Fix 2: Re-Verify and Re-Authorize the Service Connection
In Azure DevOps:
- Edit service connection
- Re-authorize
- Re-verify permissions

Fix 3: Use Least but Sufficient Permissions
Assigned:
- `Contributor` or custom role
- Correct subscription and resource group scope
Avoid overly restrictive roles.

Fix 4: Enable Monitoring and Alerts
Added reminders for:
- Secret expiration
- Certificate rotation
- Permission audits

Fix 5: Move to Managed Identity (Where Possible)
For Azure-hosted agents:
- Use Managed Identity
- Avoid secrets completely

Best Practices to Avoid This Issue
- Track service principal secret expiration  
- Prefer certificate or workload identity auth  
- Periodically re-verify service connections  
- Avoid manual permission changes  
- Document service connection ownership

This incident reinforced a hard truth:
CI/CD pipelines depend on external identities that can break silently. A green pipeline yesterday doesn’t guarantee a green pipeline today.

## Final Thoughts

If a service connection fails suddenly:
- Assume credentials or permissions first
- Don’t waste time debugging YAML
Treat service connections as production dependencies not set-and-forget configuration.

