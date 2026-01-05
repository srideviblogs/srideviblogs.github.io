---
layout: post
title: "Azure DevOps Pipeline Was Green, But Nothing Was Deployed"
date: 2025-06-13 12:00:00 +0000
categories: [cicd]
tags: [cicd, azure-devops, ado, cicd, pipelines]
image: /assets/images/devops1.jpg
permalink: /cicd/ado-pipeline-issue
---

The Azure DevOps pipeline finished successfully. Every stage was green. No warnings or failed tasks but production was still running old code.
No deployment happened even though the pipeline clearly said Succeeded. This wasn’t a flaky agent or a transient failure. It was a silent pipeline misconfiguration issue.

Initial Assumptions (All Wrong)
When a pipeline is green, teams usually assume:
-  The release was deployed
-  The deployment job executed
-  Infrastructure or app changes are live

None of these were true.
The pipeline never executed a deployment, but still returned success.

The pipeline was split into stages:
- Build
- Deploy

The `Deploy` stage had a **condition** that depended on a variable.

```yaml
- stage: Deploy
  condition: eq(variables['deployToProd'], 'true')
  jobs:
    - job: DeployApp
      steps:
        - script: echo "Deploying to production"
```
The variable `deployToProd` was never set to true. So Azure DevOps simply skipped the entire Deploy stage.
Skipped ≠ Failed
Skipped ≠ Error
Skipped = Green pipeline

Why This Was Missed
Azure DevOps behavior here is subtle but dangerous:
- Skipped stages do NOT fail the pipeline
- No alert is raised
- UI still shows “Succeeded”

In the stage view, the Deploy stage showed:
⚪ Skipped

Which most people ignored because the pipeline status was green.

How I Confirmed the Issue
We checked the pipeline logs and saw:
```text
Stage 'Deploy' skipped due to condition evaluation.
```
Then we inspected the variables:
```yaml
variables:
  deployToProd: false
```
No override in:
- Pipeline UI
- Variable Groups
- Release parameters
So deployment never even started.

The Fix

Option 1: Make Deployment Explicit
Instead of conditional deployment, enforce deployment for production branches:
```yaml
condition: and(
  succeeded(),
  eq(variables['Build.SourceBranch'], 'refs/heads/main')
)
```

Option 2: Fail If Deployment Is Skipped
Force the pipeline to fail when deploy is skipped:
```yaml
- stage: ValidateDeploy
  jobs:
    - job: CheckDeploy
      steps:
        - script: |
            if [ "$(deployToProd)" != "true" ]; then
              echo "Deployment disabled, failing pipeline"
              exit 1
            fi
```

Option 3: Visual Guardrail (Best Practice)
Rename stages clearly:
- Deploy (Conditional – Check Variables)
So engineers know it might be skipped.


In Azure DevOps:
- Pipelines can succeed
- Stages can be skipped
- Production can remain untouched
All at the same time.

Production Takeaway
Always verify:
- Which stages actually ran
- Which conditions were evaluated
- Whether deployment jobs executed
A green pipeline is only useful if you understand what it skipped.

This incident didn’t break production. It broke trust in the pipeline which is worse.
If your pipeline can skip deployments silently, it’s only a matter of time before this happens to you.
