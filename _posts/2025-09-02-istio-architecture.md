---
layout: post
title: "Istio Architecture Explained (In Simple Terms)"
date: 2025-09-02 10:00:00 +0000
categories: istio
tags: [istio, service-mesh, sidecar, envoy]
image: /assets/images/istio.jpg
---

In my previous post, I explained **why Istio is needed**.  
In this post, I will explain **how Istio works internally**, in a very simple way.

---

## Istio Has Two Main Parts

Istio architecture is easy to understand if you remember just two things:

1️⃣ **Data Plane**  
2️⃣ **Control Plane**

---

## What Is a Sidecar Container?

A **sidecar container** is an extra container that runs **alongside your application container** inside the same pod.

In Istio:
- Your app runs in one container
- An **Envoy proxy** runs as a sidecar container
- Both share the same network namespace

This sidecar **intercepts all incoming and outgoing traffic**.

Your application does **not** talk directly to other services anymore — the sidecar does it for you.

---

## Data Plane (Where Traffic Flows)

The **data plane** is made up of these **Envoy sidecar containers**.

Each sidecar handles:
- Service‑to‑service traffic
- mTLS encryption
- Retries and timeouts
- Metrics and tracing

Your application code remains untouched.

---

## Control Plane (Where Decisions Are Made)

The **control plane** tells sidecars *how* to behave.

In modern Istio, this is handled by **istiod**.

`istiod` is responsible for:
- Pushing routing rules
- Managing certificates
- Enabling mTLS
- Enforcing security policies

Important point:
**Control plane does NOT handle traffic** — it only configures sidecars.

---

## Simple Traffic Flow

1. Service A sends a request  
2. Request goes to Service A’s sidecar  
3. Sidecar applies rules (mTLS, routing)  
4. Request reaches Service B’s sidecar  
5. Sidecar forwards it to Service B  

All intelligence lives in the sidecars.

---

## Why Sidecar Is the Core Idea of Istio

The sidecar pattern allows Istio to:
- Work with any language
- Avoid code changes
- Apply consistent security and traffic rules
- Centralize control at the platform level

This is what makes Istio powerful.

---

## Final Thoughts

Istio doesn’t replace Kubernetes.  
It **adds control over service communication** using sidecar proxies.

Once you understand **sidecar + control plane**, Istio architecture becomes very simple.

In the next post, I will explain **TLS vs mTLS and why Istio uses mTLS by default**.
