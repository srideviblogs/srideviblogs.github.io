---
layout: post
title: "Istio Basics: What It Is and Why I Started Using It"
date: 2025-09-02 10:00:00 +0000
categories: istio
tags: [kubernetes, istio, service-mesh]
image: /assets/images/istio.jpg
permalink: /istio/basics/
---

When I started with Kubernetes, everything felt sufficient pods, services, deployments, ingress.  
But as microservices increased, one gap became very clear:

Kubernetes runs services well, but it doesn’t manage how services communicate.
That’s where Istio comes in.

What Problem Istio Actually Solves

Before Istio, most of our microservices handled:
- Retries
- Timeouts
- TLS
- Metrics
- Logging

Inside the application code.
This led to:
- Inconsistent behavior
- Difficult debugging
- Risky deployments

Istio is a service mesh that helps manage service-to-service communication in Kubernetes:

- Provides traffic management, security (mTLS) and observability.
- Works via sidecar proxies (Envoy) injected into pods.
- Separates application logic from infrastructure concerns.

Why I Started Using Istio

In my projects, I faced challenges like:

- Managing service-to-service TLS** manually
- Monitoring service latency and retries
- Routing traffic for canary deployments

Istio solved these by standardizing communication, securing traffic and providing observability.

Key Concepts

- Sidecar Proxy: Envoy injected into each pod to intercept traffic
- Control Plane: Istiod manages configuration, mTLS certificates, and traffic policies
- Data Plane: Envoy sidecars handle actual traffic routing
- VirtualService & DestinationRule: Define routing rules and policies
- Gateways: Handle ingress/egress traffic for the mesh

Real-Time Scenario I Faced

- Initially, I deployed multiple microservices without Istio
- Hard to enforce TLS and observe traffic
- After Istio installation:
  - Automatic sidecar injection caused initial pod restarts
  - Some services could not communicate because mTLS was enabled by default

Debugging and Commands

1. Check sidecar injection status
```bash
kubectl get pods -n my-namespace
kubectl describe pod <pod-name>
```
2. Verify Istio components
```bash
kubectl get pods -n istio-system
istioctl version
```
3. Check traffic routing
```bash
istioctl proxy-status
istioctl proxy-config routes <pod-name> -n my-namespace
```
Traffic flow 

- without Istio

```nginx
Service → Pod
```
- with Istio
```nginx
Service → Envoy → App → Envoy → Destination
```

When Istio Makes Sense

- Istio is powerful, but not always needed.
- It makes sense when:
- You have many microservices
- You need fine-grained traffic control
- Security between services matters
- Observability is critical

It may be overkill for small setups.

## Lessons Learned

- Always enable automatic sidecar injection in new namespaces
- Understand default mTLS policies to prevent traffic failures
- Istio simplifies traffic observability but adds learning overhead initially



