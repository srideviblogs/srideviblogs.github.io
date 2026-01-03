---
layout: post
title: "CrashLoopBackOff in Kubernetes: What Was Breaking My Pod Startup"
date: 2025-07-06 10:00:00 +0000
categories: [kubernetes]
tags: [kubernetes, crashloopbackoff, liveness, readiness, containers]
image: /assets/images/kubernetes.jpg
permalink: /kubernetes/crashloop-backoff
---

Sometimes pods keep restarting even though everything looks fine in your YAML. Recently, while deploying a new version of our application, I noticed pods entering CrashLoopBackOff, causing temporary outages. This post shows how I debugged a real CrashLoopBackOff caused by liveness/readiness and configuration issues and how to quickly find the root cause.

Running:
```bash
kubectl get pods
````
I saw:
```bash
NAME                     READY   STATUS             RESTARTS
myapp-6d9c7f7d6b-vzq9l   0/1     CrashLoopBackOff   6
```
The CrashLoopBackOff status meant Kubernetes was trying to start the pods, but something inside the container kept failing. 
It does not mean:
- Image pull failed
- Node issue
- Kubernetes bug

The container started, exited and Kubernetes is backing off before restarting it again.
So the first question is simple:
Why is the container exiting?

Checking the Pod Events
```bash
kubectl describe pod myapp-6d9c7f7d6b-vzq9l
```
Near the bottom:
```yaml
Last State:     Terminated
  Reason:       Error
  Exit Code:    1
```
The container exited on its own. Kubernetes just kept restarting it.

Looking at the Logs (The Right Way)
Most people run:
```bash
kubectl logs myapp-6d9c7f7d6b-vzq9l
```
And see nothing useful. The important command is:
```bash
kubectl logs myapp-6d9c7f7d6b-vzq9l --previous
```
That showed the real issue:
```bash
Error: required environment variable DATABASE_URL not set
```
The Root Cause
The Deployment expected an environment variable:
```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: database-url
```
But the secret didn’t exist.

Why the Pod Still Started

Kubernetes:
- Created the container
- Injected environment variables
- Started the process
The application itself exited when the variable was missing.

From Kubernetes’ perspective:
> Container exited → restart
> Repeated exits → backoff

Confirming the Missing Secret
```bash
kubectl get secret app-secrets
```
```bash
Error from server (NotFound): secrets "app-secrets" not found
```
That explained the exit code 1.

Fixing the Issue
Creating the secret:
```bash
kubectl create secret generic app-secrets --from-literal=database-url=postgres://user:pass@db:5432/app
```
Restarting the pod:
```bash
kubectl rollout restart deployment myapp
```
Check the pod:
```bash
kubectl get pods
NAME                     READY   STATUS    RESTARTS
myapp-6d9c7f7d6b-xk2jm   1/1     Running   0
```
CrashLoopBackOff disappeared immediately.

Another CrashLoopBackOff I Faced Later, not all CrashLoopBackOffs are config-related.
Later, I hit this:
```text
standard_init_linux.go:228: exec user process caused: no such file or directory
```
That turned out to be:
- Wrong entrypoint
- Script with Windows line endings
- Image built incorrectly
Same symptom. Very different cause.

How I Debug CrashLoopBackOff Now
- Describe the pod
```bash
kubectl describe pod <pod>
```
- Check previous logs
```bash
kubectl logs <pod> --previous
```
Use `kubectl get events` to spot repeated restarts or scheduling issues.

- Check exit codes
- Verify env vars, secrets, config maps
- Check entrypoint and command
Almost never a Kubernetes issue.

Why This Is So Confusing
- Pod keeps restarting
- Logs disappear quickly
- Error messages are short-lived
- Status message is generic
Unless you know where to look, it feels random.

