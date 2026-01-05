---
layout: post
title: "Pod Is Running but Application Is Not Reachable: How I Debugged It"
date: 2025-07-05 10:00:00 +0000
categories: [kubernetes]
tags: [kubernetes, networking, service, debugging]
image: /assets/images/kubernetes.jpg
permalink: /kubernetes/pod-running-application-not-reachable-debugging/
---

The deployment was successful. The pod was Running. Kubernetes reported no errors.Yet the application was unreachable.
This incident didn’t involve crashes, restarts, or failed health checks. There were no warning events and nothing obvious in the logs. 
From the cluster’s perspective, everything was healthy—while from a user’s perspective, the service was completely down.

This post documents how I traced a silent production failure caused not by infrastructure instability, but by a subtle configuration mismatch that Kubernetes accepted without complaint. 
The issue was simple, the impact was total and the signal was easy to miss unless you knew exactly where to look.

```bash
kubectl get pods
NAME                     READY   STATUS    RESTARTS
myapp-7d9c6d8d5f-pkz7m   1/1     Running   0
```
From Kubernetes’ point of view, everything looked healthy. 
But the application was not reachable.

What Was Failing
Accessing the service returned nothing:
```bash
curl http://myapp-service
```
```text
Connection timed out
```
No errors. No logs. Just silence.

First Check: Service and Endpoints
```bash
kubectl get svc myapp-service
TYPE        CLUSTER-IP     PORT(S)
ClusterIP   10.96.12.34    80/TCP
```
The service existed.

Next
```bash
kubectl get endpoints myapp-service
```
```text
<none>
```
That was the red flag.

Why Endpoints Matter

A Service without endpoints:
- Exists
- Resolves in DNS
- But sends traffic nowhere
This explained the timeout.

Inspecting the Service Selector
```bash
kubectl describe svc myapp-service
```
```text
Selector: app=myapp
```
Now checking pod labels:
```bash
kubectl get pods --show-labels
```
```text
myapp-7d9c6d8d5f-pkz7m   app=my-app
```
Notice the difference.

The Silent Mismatch

Service selector:
```yaml
selector:
  app: myapp
```
Pod labels:
```yaml
labels:
  app: my-app
```
One extra hyphen.

No error. No warning. Just no traffic.

Why Kubernetes Didn’t Fail the Deployment

Kubernetes validates:
- YAML structure
- API correctness
- It does not validate:
- Whether selectors match labels
- Whether traffic can flow
Everything was “valid”.

Confirming the Root Cause

After fixing the label:
```yaml
labels:
  app: myapp
```
Applying the change:
```bash
kubectl apply -f deployment.yaml
```
Checking endpoints again:
```bash
kubectl get endpoints myapp-service
```
```text
10.244.1.12:8080
```
Traffic immediately started flowing.

Verifying Internally
```bash
kubectl exec -it myapp-7d9c6d8d5f-pkz7m -- curl localhost:8080
```
```text
200 OK
```
From another pod:
```bash
kubectl run debug --image=busybox -it -- sh
wget -qO- http://myapp-service
```
Response received.

What Made This Tricky
- Pod was Running
- Container was healthy
- No restarts
- No events
- No warnings
Everything looked correct.

Key Lesson I Took Away

A running pod doesn’t mean:
- The app is reachable
- Traffic is routed
- The service is wired correctly
Networking depends on labels, not intentions.

## Final Thought

Kubernetes didn’t break my application. It faithfully routed traffic to exactly zero pods because that’s what I configured.
Once I stopped assuming and started checking endpoints, this issue became easy to spot.
