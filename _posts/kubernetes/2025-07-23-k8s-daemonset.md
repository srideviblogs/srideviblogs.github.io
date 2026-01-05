---
layout: post
title: "DaemonSet Pods Not Running on All Nodes: Understanding Kubernetes Node Filtering"
date: 2025-07-23 10:00:00 +0000
categories: kubernetes
tags: [kubernetes, daemonset, scheduling, troubleshooting, nodes]
image: /assets/images/kubernetes.jpg
permalink: /kubernetes/daemonset-pods-not-running-all-nodes/
---

This happened during a monitoring agent rollout. A DaemonSet was created to deploy an agent on every node in the cluster.
```bash
kubectl get daemonset node-agent
NAME             DESIRED   CURRENT   READY   UP-TO-DATE
node-agent       5         5         3       5
```
We had 5 nodes, but only 3 pods.

Check which Nodes are missing Pods
```bash
kubectl get pods -o wide -n monitoring
NAME                   READY   STATUS    NODE
node-agent-abc12       1/1     Running   worker-node-1
node-agent-def34       1/1     Running   worker-node-2
node-agent-ghi56       1/1     Running   worker-node-3
```
Two nodes were missing pods. The DaemonSet had not scheduled on all nodes.

The nodes were Ready:
```bash
kubectl get nodes
NAME             STATUS   ROLES    AGE
worker-node-1    Ready    <none>   5d
worker-node-2    Ready    <none>   5d
worker-node-3    Ready    <none>   5d
worker-node-4    Ready    <none>   2h
worker-node-5    Ready    <none>   2h
```
All nodes were healthy, but DaemonSet pods were only on some nodes. No events were immediately obvious.

Checking Pod Events
The clue was in the events for missing pods.
```bash
kubectl describe daemonset node-agent -n monitoring
Warning  FailedScheduling  10s  default-scheduler  0/5 nodes are available: 2 node(s) had taints that the pod didn't tolerate.
```
The missing nodes had taints.

Checked the nodes:
```bash
kubectl describe node worker-node-4 | grep Taints -A2
Taints: node-role.kubernetes.io/control-plane:NoSchedule
```
The nodes were Ready, but:
- They had taints that prevented pods from scheduling
- The DaemonSet had no tolerations
- Scheduler skipped these nodes silently

DaemonSet pods are subject to the same node filtering rules as regular pods. Ready nodes aren’t enough.
Node taints, node selectors, and affinity rules all filter nodes. If a node doesn’t match, the DaemonSet simply won’t schedule there.

The Fix
We had two options:

Option 1: Add a Toleration to the DaemonSet
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
kubectl apply -f node-agent-daemonset.yaml
```
Pods immediately appeared on all nodes.

Option 2: Remove the Taint (Not Recommended)
```bash
kubectl taint nodes worker-node-4 node-role.kubernetes.io/control-plane:NoSchedule-
```
This works, but may compromise node isolation.

This issue is common when:
- Control-plane nodes are tainted (NoSchedule)
- DaemonSets assume all nodes are usable
- Teams forget to add tolerations
- New nodes are added dynamically
Everything looks correct, until pods don’t appear.

When DaemonSet pods are missing, I check:
- Node status (`kubectl get nodes`)
- Node taints (`kubectl describe node <node> | grep Taints -A2`)
- Node selectors / affinity
- DaemonSet tolerations (`kubectl get daemonset <ds> -o yaml`)
Kubernetes always tells you why in the events.

## Final Thought

> DaemonSets deploy pods to all qualifying nodes, not all nodes blindly.
>  Taints, selectors, and affinity act as filters.
> If a node doesn’t meet the rules, the pod won’t appear silently.
Understanding node filtering is key to predictable DaemonSet behavior.
