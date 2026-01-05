---
layout: post
title: "Jenkins Deployed Successfully, But From the Wrong Branch"
date: 2025-06-10 12:00:00 +0000
categories: [cicd]
tags: [cicd, jenkins, rollback, artifacts, production-issues]
image: /assets/images/devops1.jpg
permalink: /cicd/jenkins-deployed-from-wrong-branch/
---

This happened during a scheduled production release. A feature was merged into the `main` branch. Jenkins picked up the change and triggered the pipeline.
- Build stage succeeded
- Tests passed
- Deployment completed
- Jenkins showed SUCCESS

The release announcement went out. A few minutes later, a developer noticed something odd. The feature wasn’t visible in production.

I have started with the usual sanity checks.
```bash
git log --oneline -1 main
```
The commit was present in `main`.
```bash
kubectl rollout status deployment myapp
```
The rollout completed without errors.
```bash
kubectl get pods
```
Pods were running and stable.
Everything pointed to a successful deployment but production behavior clearly matched older code.

From Jenkins’ point of view:
- The pipeline ran without failures
- The deployment stage executed
- No rollback occurred

There were no warnings about branches. No skipped stage and errors.
This was another silent CI/CD failure green pipeline, wrong outcome.

what actually happend
In the Jenkins console logs:
```text
Checking out Revision a8c7f32 (refs/remotes/origin/release/1.4)
```
Jenkins was not building from main. It was deploying from an old release branch.

The Jenkinsfile contained this logic:
```groovy
checkout([
  $class: 'GitSCM',
  branches: [[name: '*/release/*']],
  userRemoteConfigs: [[url: 'git@github.com:org/myapp.git']]
])
```
So even though Jenkins was triggered by a main merge:
-It checked out the latest `release/*` branch
- Built that code
- Deployed it to production
Jenkins did exactly what it was configured to do.

From Jenkins’ perspective:
- Git checkout succeeded
- Build steps ran
- Deployment completed
There is no built-in concept of “wrong branch”.

If the pipeline logic allows it, Jenkins will deploy anything.

Why This Happens in Real Teams

This setup existed because:
- Release branches were created manually
- Production deployments historically used `release/*`
- Pipeline logic was never updated when workflows changed

Over time, process drift occurred CI/CD behavior no longer matched how teams worked.

The Fix

1. Make Branch Explicit and Mandatory
Updated the checkout logic:
```groovy
branches: [[name: "*/${env.BRANCH_NAME}"]]
```
Now Jenkins builds exactly what triggered it.

2. Add Branch Validation
Added a guard before deployment:
```groovy
script {
  if (env.BRANCH_NAME != 'main') {
    error "Production deployments must come from main"
  }
}
```
3. Log Branch and Commit Clearly
At the start of every pipeline:
```groovy
echo "Deploying branch: ${env.BRANCH_NAME}"
sh 'git rev-parse HEAD'
```
This made branch mismatches obvious in logs.

In Jenkins:
- Branch logic is just code
- Old assumptions linger
- Pipelines don’t protect you from process drift

If branch rules aren’t explicit, the wrong code can reach production silently.

How I Prevent This Now
In every Jenkins pipeline:
- Deployments validate branch explicitly
- Build and deploy use the same ref
- Branch names are logged clearly
- Production accepts only one source branch

## Final Thought

Nothing failed here. Jenkins ran successfully. Git behaved correctly. The pipeline logic worked as written.
The failure was trusting an assumption that was no longer true.
