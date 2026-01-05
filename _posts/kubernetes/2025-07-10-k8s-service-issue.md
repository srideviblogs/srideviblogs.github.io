---
layout: post
title: "Service Exists but Traffic Is Not Flowing: Debugging Kubernetes Networking"
date: 2025-07-10 10:00:00 +0000
categories: [kubernetes]
tags: [kubernetes, service, networking, debugging]
image: /assets/images/kubernetes.jpg
permalink: /kubernetes/service-exists-traffic-not-flowing/
---

In Kubernetes, it’s easy to assume that if a Service exists, traffic will automatically flow to your Pods.  
I have spent hours in production thinking the cluster was broken, only to find out that the Service existed but had no ready endpoints.  

This usually happens due to small misconfigurations often introduced by developers or CI pipelines.
Let me walk you through a real incident and how we debugged it.

What I Noticed First

CI deployed a new microservice.
The Service was created successfully:
```bash
kubectl get svc paymentservice
NAME             TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
paymentservice   ClusterIP   10.96.12.34    <none>        80/TCP    5m
```
Pods were running:
```bash
kubectl get pods
NAME                            READY   STATUS    RESTARTS
paymentservice-7d6f8c9d7b-qm4zv 1/1    Running   0
```
Yet when developers tried to access the API through the Service, requests timed out. No traffic was flowing.

What Kubernetes Is Actually Doing

The Service exists, but Kubernetes only routes traffic to Pods that match its selector and are ready.
Check the endpoints:
```bash
kubectl get endpoints paymentservice
NAME             ENDPOINTS   AGE
paymentservice   <none>      5m
```
No endpoints = no routing = traffic blocked.

Check Pod Labels and Service Selector
Services route traffic to pods based on labels. I checked the Service selector:
```bash
kubectl describe svc paymentservice
```
```yaml
Selector: app=paymentservice
```
Then I verified the pods:
```bash
kubectl get pods --show-labels
NAME                             READY    STATUS    LABELS
paymentservice-7d6f8c9d7b-qm4zv   0/1     Running   app=paymentservice,version=v1
```
The labels matched the Service selector, so that wasn’t the issue.

Even if labels match, traffic won’t flow if Pods fail readiness probes.

Check Endpoints
```bash
kubectl get endpoints paymentservice
NAME          ENDPOINTS   AGE
paymentservice    <none>      5m
```
No endpoints were listed. Kubernetes wasn’t routing traffic because the Service couldn’t find any ready pods.

Inspect Readiness Probes
I checked the Deployment YAML:
```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 1
  periodSeconds: 5
```
Problems:
- initialDelaySeconds: 1 → probe starts before the app is ready
- Kubernetes marks the Pod as Not Ready
- Service endpoints remain empty

Fixing the Readiness Probe
Updated probe:
```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10   # wait for app startup
  periodSeconds: 5
  failureThreshold: 3        # tolerate temporary failures
  successThreshold: 1
```

What Changed:
- Gave the app enough time to start before probing
- Allowed a few probe failures before marking the Pod as Not Ready
- Ensures the /health endpoint accurately reflects readiness

After applying the change:
```bash
kubectl apply -f deployment.yaml
```
Endpoints populated immediately:
```bash
kubectl get endpoints paymentservice
NAME             ENDPOINTS
paymentservice   10.244.1.12:8080
```
Traffic started flowing.


How We Confirmed the Root Cause
Checked Service selector:
```bash
kubectl get svc paymentservice -o yaml
```
Checked Pod labels:
```bash
kubectl get pods --show-labels
```
Verified endpoints:
```bash
kubectl get endpoints paymentservice
```
Checked Pod readiness:
```bash
kubectl describe pod paymentservice-7d6f8c9d7b-qm4zv
```

Why This Happens in Real Production
- Developers or CI pipelines often update Deployment labels but forget to update Service selectors.
- Readiness probes can be misconfigured after new image builds or changes in application startup.
- Services and Pods exist, but Kubernetes will not route traffic unless both labels match and Pods are ready.

Production Checklist: Quick Debug
- Describe the Service: `kubectl describe svc <service>`
- Check endpoints: `kubectl get endpoints <service>`
- Check Pod labels and Service selector for exact match
- Verify Pod readiness: `kubectl get pods` + `kubectl describe pod <pod>`
- Ensure Service and Pods are in the same namespace

## Key Takeaway

If traffic is not flowing to a Service, don’t panic. Most production incidents I have seen are caused by just one small mismatch or misconfigured readiness probe.
Once you know where to look, debugging Service traffic becomes predictable and fast.

