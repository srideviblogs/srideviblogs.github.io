---
layout: post
title: "Node Is Ready but Pods Are Not Scheduling: A Real Kubernetes Scheduling Incident"
date: 2025-07-18 10:00:00 +0000
categories: kubernetes
tags: [kubernetes, scheduling, taints, tolerations, troubleshooting]
image: /assets/images/kubernetes.jpg
permalink: /kubernetes/taint-tolerance
---

This happened during a routine scale-up. New nodes joined the cluster. They showed up as Ready. Everything looked healthy.

Running:
```bash
kubectl get nodes
NAME               STATUS   ROLES           AGE   VERSION
worker-node-1      Ready    control-plane   2h    v1.27.3
```
Then the deployment was applied.

Pods were created. But none of them started running.
```bash
kubectl get pods
NAME                            READY   STATUS    RESTARTS
orders-api-7d9f8c6b5d-abc12     0/1     Pending   0
orders-api-7d9f8c6b5d-def34     0/1     Pending   0
```
Nodes were Ready. Pods were Pending.

From a distance:
- Nodes looked healthy
- Kubelet was running
- No scheduler errors were visible
It felt like Kubernetes should place the pods automatically.

The Clue Was in the Events
The real reason appeared when describing the pod.
```bash
kubectl describe pod orders-api-7d9f8c6b5d-abc12
```
Near the bottom:
```text
0/1 nodes are available: 
1 node(s) had taint {node-role.kubernetes.io/control-plane: NoSchedule}
```
This line explained the behavior.

Checking Node Taints
The node was Ready, but it was tainted.
```bash
kubectl describe node worker-node-1 | grep Taints -A2
Taints: node-role.kubernetes.io/control-plane:NoSchedule
```
The nodes were marked Ready, but they had taints that explicitly prevented pods from being scheduled unless tolerated.

From Kubernetes’ point of view:
- Node health was fine
- Scheduling rules said “do not place workloads here”
- Pods had no tolerations
So scheduling stopped.

The Real Insight

This wasn’t a scheduler failure. It wasn’t a node failure. Ready nodes can still reject pods if taints are present.
> Readiness means “usable.”
> Taints mean “restricted.”

The Fix
There were two valid ways to fix this.

Option 1: Remove the Taint (Not Recommended for Production)
```bash
kubectl taint nodes worker-node-1 node-role.kubernetes.io/control-plane:NoSchedule-
```
Pods scheduled immediately.
This works, but it breaks cluster safety assumptions.

Option 2: Add a Toleration (Preferred)
The safer fix was to tolerate the taint explicitly.
```yaml
spec:
  template:
    spec:
      tolerations:
      - key: "node-role.kubernetes.io/control-plane"
        operator: "Exists"
        effect: "NoSchedule"
```
Applied the change:
```bash
kubectl apply -f deployment.yaml
```
Pods moved out of Pending and started running.

This issue usually appears when:
- Single-node or control-plane-heavy clusters are used
- Nodes are repurposed without removing taints
- CI deploys workloads assuming worker nodes exist
- Control-plane taints are misunderstood or ignored
Everything looks healthy, until scheduling rules are applied.

How I Check Scheduling Issues Now

When nodes are Ready but pods stay Pending, I always check:
-Pod events first
- Node taints and tolerations
- Node selectors or affinity
- Resource requests vs node capacity
If a pod can’t be scheduled, Kubernetes always tells you why in plain text.

## Final Thought

Scheduling is not about availability. It’s about permission.
> Nodes may be Ready.
> Pods may be valid.
But unless the rules match, Kubernetes will wait silently.

But it didn’t.
