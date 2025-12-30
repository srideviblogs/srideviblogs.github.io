---
layout: post
title: "Sidecar Injection in Istio: What Really Happens Behind the Scenes"
date: 2025-09-04 10:00:00 +0000
categories: istio
tags: [istio, sidecar, envoy, service-mesh, kubernetes]
image: /assets/images/istio.jpg
permalink: /istio/sidecar/
---

What Is a Sidecar (in Simple Terms)?

A sidecar is an extra container that runs alongside your application container inside the same Pod.

It is:
- not your application
- not part of your code
- not something you import as a library

Instead, it intercepts and manages traffic for your application.

In Istio, this sidecar is Envoy proxy.
So when we say:
> “Istio injects a sidecar”

What it really means is:
> “Istio adds an Envoy proxy container next to your app container.”

What Does the Istio Sidecar Actually Do?

The Envoy sidecar:
- intercepts all inbound traffic
- intercepts all outbound traffic
- applies routing rules
- enforces mTLS
- collects metrics, logs, and traces

Your application:
- doesn’t know Envoy exists
- doesn’t change its code
- just listens on its normal port

There are two types of injection:

1. Automatic – via namespace label (`istio-injection=enabled`)  
2. Manual – adding the sidecar explicitly in pod YAML using `istioctl kube-inject`

What Is Sidecar Injection (Really)?

Sidecar injection is **not** Istio “adding a container later”.
It is:
- a Kubernetes mutating admission webhook
- that modifies the pod spec
- before the pod is created

Once the pod is running, injection is no longer possible. This timing detail explains many real production issues.

The Admission Webhook Flow

Here’s what really happens step by step:

1. You apply a Deployment
2. Kubernetes prepares to create a Pod
3. Admission webhooks are triggered
4. Istio’s mutating webhook intercepts the request
5. Envoy sidecar is injected
6. Init containers are added
7. Pod is scheduled on a node

No webhook → no sidecar → no mesh.

Namespace Label: What It Actually Does

When you run:
```bash
kubectl label namespace my-namespace istio-injection=enabled
```
You are not enabling Istio globally.

You are telling Kubernetes:
“For pods created in this namespace, call Istio’s webhook.”

Pods created before this label:
- will NOT get a sidecar
- will NEVER get one unless restarted

What Gets Injected into the Pod

After injection, the pod spec changes significantly.
Containers
```text
- application container
- istio-proxy (Envoy sidecar)
```
Init Containers
```text
- istio-init
```
The init container configures iptables rules so traffic flows through Envoy.
Without this step, Envoy would be running but useless.

iptables: The Invisible but Critical Piece

The istio-init container:
- redirects inbound traffic → Envoy
- redirects outbound traffic → Envoy
- excludes health check ports

Verifying Sidecar Injection (Always Verify)
Check containers:
```bash
kubectl get pod my-app -o jsonpath='{.spec.containers[*].name}'
```
Expected:
```text
my-app istio-proxy
```
Check init containers:
```text
kubectl get pod my-app -o jsonpath='{.spec.initContainers[*].name}'
```
Expected:
```text
istio-init
```
If either is missing, the pod is not fully meshed.

Partial Injection: The Most Dangerous State

This happens when:
- namespace is labeled late
- old pods are still running
- new pods have sidecars, old ones don’t

Symptoms:
- random mTLS failures
- one-way traffic
- unexplained 503 errors

Always restart workloads after enabling injection:
```bash
kubectl rollout restart deployment -n my-namespace
```
Disabling Injection for Specific Pods

You can safely exclude pods like this:
```bash
metadata:
  annotations:
    sidecar.istio.io/inject: "false"
```
Use cases:
- Jobs
- CronJobs
- DaemonSets
- Infrastructure components

## Final Thoughts

Once I understood:
what a sidecar actually is, how it’s injected and how traffic is redirected.
That’s the turning point for using Istio confidently in production.

