---
layout: post
title: "Argo CD Basics: How GitOps Actually Works in Real Clusters"
date: 2025-10-07 
categories: [argocd]
tags: [argocd, gitops, kubernetes, devops]
image: /assets/images/argocd.jpg
permalink: /argocd/basics
---

Argo CD is often introduced as:
> “A declarative GitOps continuous delivery tool for Kubernetes.”
That definition is correct but it doesn’t explain how Argo CD behaves in real environments.
I will cover only what you actually need to understand before debugging production issues.

What Problem Does Argo CD Solve?

In real environments, teams struggle with:
- Drift between Git and cluster state
- Manual kubectl changes in production
- Environment mismatches (dev ≠ prod)
- No clear rollback strategy
- Hard-to-debug CI/CD failures
Argo CD solves this by making Git the single source of truth for Kubernetes.

What Is GitOps (In Practice)?

GitOps means:
- Kubernetes manifests live in Git
- Git changes trigger deployments
- The cluster continuously reconciles itself to Git
- Drift is detected and corrected automatically

What Argo CD Really Does
At its core, Argo CD continuously answers one question:
> Does my cluster match what’s in Git?

If the answer is no, Argo CD:
- Shows a diff
- Flags the application as `OutOfSync`
- Optionally fixes it automatically

Traditional CI/CD
```text
CI → kubectl apply → Cluster
```
GitOps with Argo CD
```text
Git → Argo CD → Cluster
```
Argo CD pulls changes instead of CI pushing them. This pull-based model is more secure and easier to audit.

Core Components (You’ll See These in Logs)

When debugging Argo CD, these components matter:

| Component                       | What it does |
|---------------------------------|----------------------------------|
| `argocd-server`                 | UI, API, SSO                     |
| `argocd-repo-server`            | Pulls Git repos, Helm, Kustomize |
| `argocd-application-controller` | Compares Git vs cluster          |
| `argocd-dex-server` (optional)  | Legacy auth                      |

Knowing which component owns which failure saves hours.

The Argo CD Application (The Heart of Everything)

An Argo CD Application defines:
- Where Git lives
- What to deploy
- Where to deploy

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: git@github.com:org/my-app.git
    targetRevision: main
    path: manifests
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```
This file is more important than your Deployment YAML.

Argo CD Workflow (AKS & EKS Example)
Developer pushes code to Git
```bash
git commit -m "Update Helm values"
git push origin main
```
Argo CD detects the change
- Polling or webhook
- Repo Server pulls manifests
Desired vs Live State Comparison
```text
Git: replicas = 3
Cluster: replicas = 2
```
Sync Status vs Health (Common Confusion)

These two are not the same.
Sync Status
> Synced → Git and cluster match
> OutOfSync → Drift detected
Health Status
> Healthy → App is running
> Degraded → App is broken

Git Is the Source of Truth. For GitOps to work:
- No manual kubectl apply
- No parallel CD pipelines
- All changes via Git
- Argo CD owns the namespace
Breaking these rules creates silent drift.

When Argo CD Fails, Where to Look First
```bash
kubectl get applications -n argocd
kubectl describe application my-app -n argocd
```
then logs
```bash
kubectl logs -n argocd deploy/argocd-repo-server
kubectl logs -n argocd deploy/argocd-application-controller
kubectl logs -n argocd deploy/argocd-server
```

Argo CD is predictable once you understand how it thinks.
Most problems don’t come from the tool itself, but from how it’s used alongside manual changes, multiple pipelines, and unclear ownership.
