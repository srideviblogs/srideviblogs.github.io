---
layout: post
title: "Istio Gateways: Ingress vs Egress"
date: 2025-09-12 10:00:00 +0000
categories: istio
tags: [istio, ingress-gateway, egress-gateway, service-mesh, networking]
image: /assets/images/istio.jpg
permalink: /istio/ingress-egress/
---

Gateways are where Istio meets the outside world. Most teams understand sidecars and traffic inside the mesh, but production issues usually start when traffic enters or leaves the mesh**.

Ingress and Egress Gateways look simple on paper.
In reality, they are responsible for:
- broken external access
- mTLS failures
- unexpected traffic bypassing policies
- security gaps teams don’t even realize exist

In this post, I will break down Ingress vs Egress Gateways, how they actually work.

Why Istio Needs Gateways at All

Inside the mesh:
- traffic is encrypted
- identities are known
- policies are enforced

Outside the mesh:
- traffic is untrusted
- identities are unknown
- security must be explicit

Gateways act as controlled entry and exit points.

Ingress Gateway: Traffic Coming Into the Mesh

An Ingress Gateway handles:
- traffic from outside the cluster
- traffic from outside the mesh
- north-south traffic

Examples:
- user requests from the internet
- API calls from external systems
- traffic from legacy services

How Ingress Gateway Actually Works

Ingress Gateway is:
- a dedicated Envoy proxy
- running as a Kubernetes Deployment
- separate from application sidecars

Traffic flow:

```text
Client → LoadBalancer → Istio Ingress Gateway → Envoy Sidecar → App
```
Ingress Gateway is not a Kubernetes Ingress controller replacement, it works with Kubernetes networking.

Basic Ingress Gateway Setup
Gateway Resource
```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: my-ingress-gateway
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: tls-cert
    hosts:
    - "myapp.example.com"
```
This defines:
- which gateway pod handles traffic
- which ports are exposed
- which hosts are allowed

VirtualService pointing to Ingress Gateway:
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp-vs
  namespace: my-namespace
spec:
  hosts:
  - "myapp.example.com"
  gateways:
  - my-ingress-gateway
  http:
  - route:
    - destination:
        host: myapp-service
        port:
          number: 80
```
Without this VirtualService, traffic reaches the gateway but goes nowhere.

Common Ingress Production Issue

Issue: Gateway Exists but App Not Reachable
Cause:
- VirtualService not bound to gateway

Symptom:
- 404 from gateway
- app pods are healthy

Always verify:
```bash
kubectl get virtualservice
```

Egress Gateway: Traffic Going Out of the Mesh

An Egress Gateway controls:
- traffic leaving the mesh
- outbound calls to external services
- compliance and security boundaries

Examples:
- calling third-party APIs
- accessing databases outside cluster
- auditing outbound traffic

Why Egress Gateway Matters in Production

Without Egress Gateway:
- pods can call the internet directly
- no central control
- no auditing

With Egress Gateway:
- all outbound traffic is controlled
- policies are enforced
- destinations are explicitly allowed

How Egress Gateway Works
Traffic flow:
```text
App → Sidecar Envoy → Egress Gateway → External Service
```
Egress Gateway is optional, but critical for regulated environments.

Step 1: Define External Service (ServiceEntry)
```yaml
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-api
  namespace: my-namespace
spec:
  hosts:
  - "api.external-service.com"
  location: MESH_EXTERNAL
  ports:
  - number: 443
    name: https
    protocol: HTTPS
  resolution: DNS
```
Without ServiceEntry:
- STRICT mTLS environments block traffic
- external calls fail silently

Step 2: Route Through Egress Gateway
Gateway Definition
```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: my-egress-gateway
  namespace: istio-system
spec:
  selector:
    istio: egressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    hosts:
    - "api.external-service.com"
```
VirtualService for Egress
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: external-api
spec:
  hosts:
  - api.external.com
  gateways:
  - egress-gateway
  tls:
  - match:
    - port: 443
    route:
    - destination:
        host: api.external.com
```
This forces traffic through the egress gateway.

Real Production Issues with Egress Gateway
Traffic Bypasses Egress Gateway

Cause:
- missing VirtualService
- ServiceEntry only defines destination

Result:
- policies not enforced
- traffic leaks
Always validate routing paths.

Debugging Commands

Check gateways and virtual services
```bash
kubectl get gateway -n istio-system
kubectl get virtualservice -n my-namespace
```
Inspect proxy routes for Ingress Gateway
```bash
istioctl proxy-config routes <ingress-pod> -n istio-system
```
Test external traffic via Egress Gateway
```bash
kubectl exec -it pod-a -n my-namespace -- curl -v https://api.external-service.com
```

## Key Points

- Always map VirtualService hosts to the correct Gateway
- Egress traffic requires ServiceEntry + optional Gateway
- TLS misconfigurations can silently block traffic

