---
layout: post
title: "Argo CD OutOfSync but No Changes Applied: A Real Debugging Story"
date: 2025-10-10 
categories: [argocd]
tags: [argocd, debug, outofsync, gitops, kubernetes]
image: /assets/images/argocd.jpg
permalink: /argocd/sync-issues
---

This is one of the most confusing Argo CD issues I have faced in production:
> Argo CD shows OutOfSync,  
> you click Sync,  
> but nothing gets applied.

No errors.  
No changes.  
Still OutOfSync.

Here’s how I debugged it step by step.

The Scenario
Application status in Argo CD UI:
- Sync Status: OutOfSync
- Health: Healthy

Sync attempt:
```bash
$ argocd app sync my-app
```
Output
```bash
INFO[0000] Starting sync
INFO[0001] No resources need to be synced
INFO[0001] App my-app synced successfully
```
But the app still remained OutOfSync.

Check What Argo CD thinks is different
First thing I ran:
```bash
$ argocd app diff my-app
```
Output
```bash
===== apps/v1/Deployment my-app =====
- metadata.annotations.kubectl.kubernetes.io/last-applied-configuration
```
This was the only diff.
- No spec changes
- No image changes
- No replicas change
Just an annotation.

Understand Why Sync Does Nothing
That annotation:
```bash
kubectl.kubernetes.io/last-applied-configuration
```
is automatically added by `kubectl apply`, but not present in Git.

Why Sync Didn’t Fix It
Argo CD does not blindly overwrite everything. Some fields:
- Are defaulted by Kubernetes
- Are enforced by admission controllers
- Should not be force-applied
So Argo CD reports drift, but refuses to fix it.

So Argo CD marks the app:
```text
OutOfSync (but nothing to apply)
```
Confirm It’s an Annotation-Only Drift
To be sure, I ran:
```bash
$ kubectl get deploy my-app -o yaml | grep kubectl.kubernetes.io
```
Output
```yaml
kubectl.kubernetes.io/last-applied-configuration: |
  {...}
```
And confirmed Git did NOT have it.

Why This Happens in Real Environments
This usually happens when:
- Someone runs kubectl apply -f deployment.yaml
- A hotfix is applied manually
- CI/CD pipeline uses kubectl apply alongside Argo CD
- Argo CD notices the annotation but cannot reconcile it safely.

The Actual Fix : Ignore the Annotation (Recommended)
The correct fix is to tell Argo CD to ignore this diff.

Add ignoreDifferences to the Application:
```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /metadata/annotations/kubectl.kubernetes.io~1last-applied-configuration
```
Apply it:
```bash
$ kubectl apply -f application.yaml
```
Result
```yaml
Sync Status: Synced
Health: Healthy
```

## Final Takeaway

OutOfSync does not always mean “apply harder”.
Sometimes it means:
- Kubernetes changed something
- Argo CD noticed
- And correctly refused to overwrite it
- Understanding this saves hours of blind debugging.
  
