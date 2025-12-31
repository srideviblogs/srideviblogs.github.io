---
layout: post
title: "Canary Deployments with Istio: Real-World Setup and Production Issues"
date: 2025-09-10 10:00:00 +0000
categories: istio
tags: [istio, canary, deployments, traffic-management, service-mesh]
image: /assets/images/istio.jpg
permalink: /istio/canary/
---

Canary deployments are often described like this:

> “Send 10% traffic to the new version and monitor.”

In reality, canary deployments are where:
- misconfigurations surface
- mTLS breaks unexpectedly
- retries amplify traffic
- metrics lie if you don’t understand them

In this post, I will walk through how canary deployments actually work in Istio, and the real production issues, I have seen while running them.

What Is a Canary Deployment?

A canary deployment means:
- releasing a new version to a small percentage of traffic
- observing behavior
- gradually increasing traffic if stable

In Istio, canaries are implemented using:
- VirtualService
- DestinationRule

No new Services.
No load balancer changes.
Pure traffic control.

Typical Istio Canary Architecture

```text
Client
  ↓
Envoy Sidecar
  ↓
VirtualService (traffic split)
  ↓
DestinationRule (subsets)
  ↓
Pods (v1, v2)
```
Everything happens at the Envoy layer.

Step 1: Deploy Multiple Versions

Version v1 (stable)
```yaml
labels:
  app: reviews
  version: v1
```
Version v2 (canary)
```yaml
labels:
  app: reviews
  version: v2
```
Verify pods:
```bash
kubectl get pods -l app=reviews --show-labels
```
Step 2: DestinationRule (Define Subsets)
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```
Without this, canary routing will not work.

Step 3: VirtualService (Traffic Split)

Start Small (90/10)
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - route:
    - destination:
        host: reviews
        subset: v1
      weight: 90
    - destination:
        host: reviews
        subset: v2
      weight: 10
```
Apply and verify:
```bash
kubectl apply -f virtualservice.yaml
```

Observing Canary Traffic (Very Important)
Don’t rely only on application logs.
Use:
- Istio metrics
- Envoy stats
- request success rates

Helpful commands:
```bash
istioctl proxy-config routes pod-name
istioctl proxy-config clusters pod-name
```
These show what Envoy is actually doing.

Real Production Issue #1

Canary Pods Not Receiving Traffic
Cause:
- subset labels don’t match pod labels

Symptom:
- v2 shows 0 requests
- traffic silently routes to v1

Fix:
```bash
kubectl get pods --show-labels
```
Always verify labels.

Real Production Issue #2

mTLS Breaks Only for Canary
Cause:
- DestinationRule applies mTLS
- Canary service account differs
- AuthorizationPolicy blocks identity

Symptom:
```text
503 upstream connect error
```
Debug:
```bash
istioctl proxy-config secret pod-name
```
Canary identities must be allowed.

Real Production Issue #3

Slow Canary Causes Cascading Failures
If canary response time is high:
- upstream retries increase
- downstream services overload
- failure spreads

Solution:
- enforce timeouts
```yaml
timeout: 5s
```
Timeouts are mandatory in canaries.

Gradually Increasing Traffic (Best Practice)
10% → 25% → 50% → 100%
Update weights gradually:
```bash
kubectl apply -f virtualservice.yaml
```
Rollback Strategy (Underrated but Critical)

Rollback is just a config change:
```yaml
weight: 0
```
- No redeploy.
- No pod deletion.
- Instant rollback.
This is one of Istio’s biggest strengths.

