---
layout: post
title: "Istio mTLS: How It Works and Why It Breaks"
date: 2025-09-06 10:00:00 +0000
categories: istio
tags: [istio, mtls, tls, security, service-mesh]
image: /assets/images/istio.jpg
permalink: /istio/mtls/
---

Before getting into Istio mTLS, let’s take a step back.
Most issues I’ve seen with Istio security happened because teams enabled mTLS without fully understanding what TLS or mTLS actually means.
So let’s start simple.

TLS vs mTLS (In Simple Terms)
What Is TLS?

TLS (Transport Layer Security) encrypts traffic between a client and a server.
- Client verifies the server
- Server presents a certificate
- Traffic is encrypted

Example:
```text
Browser → HTTPS → Web Server
```
Here:
- Client trusts the server
- Server does NOT verify the client
This is one-way trust.

What Is mTLS?

mTLS (Mutual TLS) means:
- Client verifies the server
- Server verifies the client
- Both sides present certificates

Example:
```text
Service A ↔ Service B
```
Now:
- Identity is verified on both ends
- Traffic is encrypted
- Unauthorized services are blocked
- This is zero-trust networking.

Why Istio Uses mTLS

In Kubernetes:
- Pods are ephemeral
- IPs change constantly
- Network boundaries are weak

Istio solves this by:
- giving every workload a cryptographic identity
- enforcing mTLS by default (if enabled)

In Istio, identity looks like:
```text
spiffe://cluster.local/ns/default/sa/reviews
```
Identity is tied to:
- Namespace
- Service Account
- Not IP address
  
How Istio mTLS Actually Works

This is where things get interesting.
Istio mTLS is not handled by your application.

It is handled by:
- Envoy sidecars
- Certificates issued by Istiod (Citadel)

Your app:
- sends plain HTTP
- Envoy upgrades it to mTLS
- Envoy decrypts it on the other side

Your code remains untouched.

Certificate Lifecycle in Istio

Here’s the real flow:
- Pod starts
- Envoy sidecar starts
- Envoy requests certificate from Istiod
- Istiod issues short-lived cert
- Envoy uses cert for mTLS
- Certificates auto-rotate
No manual cert management.No restarts required.

PERMISSIVE vs STRICT (Very Important)
PERMISSIVE
- Allows gradual rollout
- Supports legacy services
- Harder to detect issues

STRICT
- Strong security
- Breaks non-meshed services
- Best for mature environments

Most production outages happen when switching from PERMISSIVE to STRICT.

Why mTLS Breaks in Production (Real Reasons)

Reason 1: Partial Sidecar Injection

Some pods have Envoy, some don’t.
Result:
- Envoy expects mTLS
- Plaintext traffic arrives
- Handshake fails

Symptom:
```text
503 upstream connect error
```

Reason 2: Namespace Not Fully Meshed

- Service A in meshed namespace
- Service B in non-meshed namespace

STRICT mTLS blocks traffic completely. Always verify both sides are meshed.

Reason 3: DestinationRule mTLS Mismatch
```yaml
trafficPolicy:
  tls:
    mode: ISTIO_MUTUAL
```
But PeerAuthentication disables mTLS.

Result:
- Client uses mTLS
- Server rejects connection
This mismatch is extremely common.

Commands to debug mTLS issues
Check mTLS Mode
```bash
kubectl get peerauthentication -n my-namespace
```
Check Envoy Certificates
```bash
istioctl proxy-config secret pod-name
```
Check TLS Settings
```bash
istioctl proxy-config clusters pod-name
```
Check Traffic Errors
```bash
kubectl logs pod-name -c istio-proxy
```
Look for
```text
TLS handshake error
```
Safely Rolling Out mTLS (Best Practice)
- Enable sidecar injection everywhere
- Start with PERMISSIVE
- Fix non-meshed services
- Observe metrics
- Switch to STRICT gradually
Never jump directly to STRICT in production.

