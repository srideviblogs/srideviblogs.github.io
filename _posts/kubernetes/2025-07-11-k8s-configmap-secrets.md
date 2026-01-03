---
layout: post
title: "ConfigMap/Secret Changes Not Reflecting in Pods: How I Finally Debugged It"
date: 2025-07-11 10:00:00 +0000
categories: kubernetes
tags: [kubernetes, configmap, secret, pods, debug]
image: /assets/images/kubernetes.jpg
permalink: /kubernetes/configmap
---

In Kubernetes, updating a ConfigMap or Secret feels like it should be instant. The change applies successfully, no errors show up yet the application keeps behaving the old way.
I have seen this confuse developers and on-call engineers many times in production. Let’s walk through a real incident and why this happens.

What I Noticed First

A developer updated a feature flag and a database password.

```bash
kubectl apply -f configmap.yaml
configmap/app-config configured
```
Pods were still running. No restarts. No errors.
But the application was still using the old values.

First Assumption (Which Was Wrong)
The initial assumption was:
- The ConfigMap didn’t update
- The Secret didn’t update
So we checked.

Both Resources Were Correct

I have verified both resources directly:
```bash
kubectl get configmap app-config -o yaml
kubectl get secret app-secret -o yaml
```
Both had the updated values.

Both had the updated values, so the resources were correct in the cluster. 
The issue was that existing pods don’t automatically reload ConfigMaps or Secrets. Running Pods continue using whatever they loaded at startup.

Why This Happens

In this deployment:
- The ConfigMap was injected as environment variables
- The Secret was read once during application startup

```yaml
env:
- name: FEATURE_FLAG
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: feature.enabled
```
Environment variables are static. They never change unless the Pod restarts.

How I Confirmed It
```bash
kubectl exec -it app-7d6f8c9d7b-qm4zv -- printenv FEATURE_FLAG
```
The old value was still there. The Pod had never restarted.

The Fix

I didn’t change Kubernetes and touch the cluster.
Restarted the Pods:
```bash
kubectl rollout restart deployment app
```
New Pods came up. They picked up both:
- The updated ConfigMap
- The updated Secret
The issue was resolved immediately.

## Key Takeaways

- Updating ConfigMaps or Secrets does not automatically update running pods.
- Pods must be restarted to pick up changes when mounted as volumes.
- Automate configuration reloads with operators or controllers for production systems.
- Always check resource versions and verify the new pods have the updated config.
