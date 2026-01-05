---
layout: post
title: "Pending Pods: Why Kubernetes Refuses to Schedule in Production"
date: 2025-07-02 10:00:00 +0000
categories: [kubernetes]
tags: [kubernetes, troubleshooting, pending, pods, yaml]
image: /assets/images/kubernetes.jpg
permalink: /kubernetes/pending-pods-why-kubernetes-refuses-to-schedule/
---

I recently faced a frustrating issue in a production cluster: I deployed a new version of an application, but some pods just stayed in Pending forever. 
Users reported that the service was down, and `kubectl get pods` showed:

```bash
NAME                         READY   STATUS    RESTARTS   AGE
my-app-5d7c4f5d7f-1          0/1     Pending   0          15m
my-app-5d7c4f5d7f-2          0/1     Pending   0          15m
```
At first, it wasn’t obvious why the pods weren’t scheduling. Here’s how I debugged it and eventually fixed the issue.

Step 1: Describe the Pod
The first command I ran was:
```bash
kubectl describe pod my-app-5d7c4f5d7f-1
```
The output showed:
```text
Events:
  Type     Reason            Age   From               Message
  ----     ------            ----  ----               -------
  Warning  FailedScheduling  5m    default-scheduler  0/3 nodes are available: 3 Insufficient cpu.
```
Key insight: All nodes reported insufficient CPU.

Step 2: Check Node Resources
Next, I checked the node status:
```bash
kubectl get nodes -o wide
kubectl describe node <node-name>
```
I noticed that all worker nodes were running at high CPU and memory usage. This explained why new pods were stuck in Pending.

Step 3: Inspect Resource Requests in Pod Spec
Looking at my deployment YAML:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app-container
          image: my-app:2.0
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
```
Each pod was requesting 500m CPU, which was too high for the remaining free resources on nodes.

Step 4: Apply a Fix
I had a few options:
- Scale up the cluster (add more nodes)
- Reduce pod resource requests

I went with reducing the resource requests
```yaml
resources:
  requests:
    cpu: "200m"
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```
Applied the updated deployment:
```bash
kubectl apply -f my-app-deployment.yaml
kubectl rollout status deployment/my-app
kubectl get pods
```
Pods started scheduling successfully:
```bash
NAME                         READY   STATUS    RESTARTS   AGE
my-app-5d7c4f5d7f-1          1/1     Running   0          2m
my-app-5d7c4f5d7f-2          1/1     Running   0          2m
my-app-5d7c4f5d7f-3          1/1     Running   0          2m
```
Step 5: Additional Checks & Best Practices
- Always monitor node resources with kubectl top nodes or Prometheus/Grafana dashboards.
- For large clusters, use Horizontal Pod Autoscaler (HPA) and Cluster Autoscaler to avoid Pending pods during spikes.
- Check kubectl get events to quickly identify scheduling issues.
- Validate resource requests and limits before deploying to production.

## Key Takeaways
- Pods stuck in Pending usually indicate scheduling constraints or resource shortages.
- kubectl describe pod and kubectl get events are your best friends for troubleshooting.
- Adjust resources or scale the cluster to resolve scheduling issues.

This was a simple yet real example of how a production deployment can silently fail if the scheduler cann't find nodes with enough resources.
