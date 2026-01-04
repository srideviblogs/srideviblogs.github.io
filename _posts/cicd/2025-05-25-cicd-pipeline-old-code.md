---
layout: post
title: "CI Pipeline Was Green, But Production Was Still Running Old Code"
date: 2025-05-25 12:00:00 +0000
categories: [cicd]
tags: [cicd, pipelines, jenkins, devops]
image: /assets/images/devops1.jpg
permalink: /cicd/pipeline-oldcode
---

A small feature change was merged into the main branch. CI ran automatically.
- Build passed
- Tests passed
- Image was built and pushed
- Pipeline showed green across all stages

Everyone assumed the new code was live. But a few hours later, a bug report came in.
The feature was missing in production.

The usual checks:
```bash
git log --oneline -5
```
The commit was merged correctly.
```bash
docker images | grep myapp
```
The new image tag existed in the registry.
```bash
kubectl rollout status deployment myapp
```
The Deployment was stable. No errors. No restarts. No alerts.
But production was clearly running old behavior.

From the outside:
- CI was green
- CD reported success
- Pods were Running
- No rollback had occurred
There was no obvious failure signal.

This is the most dangerous kind of CI/CD issue everything looks correct, but reality disagrees.

What Actually Happened
After comparing the running container image with the expected one:
```bash
kubectl describe pod myapp-7d6f8c9d7b-abc12 | grep Image
```
The image tag was:
```bash
myrepo/myapp:latest
```
CI had built a new image, but the Deployment was still referencing `latest`.

Kubernetes did not pull the new image because:
- The tag did not change
- `imagePullPolicy` was `IfNotPresent`
- Nodes already had an older `latest` image cached
So the deployment succeeded but nothing actually changed.

Why CI Didn’t Catch This

CI validated:
- Code correctness
- Build success
- Image push

But it did not validate:
- Which image tag production was using
- Whether Kubernetes actually pulled the new image
- Whether running pods changed at all

CI had done its job. CD assumptions failed silently.

The Fix
Stop Using Mutable Tags in Production
We replaced latest with immutable, versioned tags.
```yaml
image: myrepo/myapp:v1.8.3
```
Force Explicit Image Pull Behavior
```yaml
imagePullPolicy: Always
```
Align CI and CD Artifact Versioning
The pipeline now:
- Builds the image
- Tags it with the commit SHA or release version
- Passes that exact tag to deployment manifests

Example:
```bash
IMAGE_TAG=$(git rev-parse --short HEAD)
```

A green pipeline does not guarantee new code is running in production. If:
- Image tags don’t change
- Pull policies are relaxed
- Deployments rely on cached artifacts
Then Kubernetes will happily keep running old code and report success while doing it.

How I Prevent This Now

In every pipeline:
- No latest in production
- Immutable image tags only
- CI outputs the exact artifact version
- CD deploys only that version
- Post-deploy checks confirm image digest, not just pod status

This incident didn’t fail loudly. It didn’t break builds. It didn’t crash pods. It didn’t trigger alerts.
It simply shipped nothing, while everyone believed it did. Those are the failures that hurt the most in CI/CD.
