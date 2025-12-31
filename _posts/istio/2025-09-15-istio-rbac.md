---
layout: post
title: "Istio AuthorizationPolicy (RBAC in Production)"
date: 2025-09-15 10:00:00 +0000
categories: istio
tags: [istio, authorizationpolicy, rbac, security, service-mesh]
image: /assets/images/istio.jpg
permalink: /istio/rbac/
---

When teams adopt Istio, mTLS often gets all the attention, but in real production environments, AuthorizationPolicy is where most outages and security incidents actually happen.

Istio AuthorizationPolicy allows fine-grained access control (RBAC) for services in the mesh:
- Define **who can access which services**
- Control access at namespace, service or method level
- Integrate with mTLS to secure communication

TAhink of it as RBAC for services, not users. AuthorizationPolicy works only after mTLS or identity is established.

How AuthorizationPolicy Works (Internals)

At runtime:
1. Traffic enters the **Envoy sidecar**
2. Envoy extracts:
   - Source identity (SPIFFE ID)
   - Request metadata (path, method, headers)
3. Envoy evaluates **AuthorizationPolicy rules**
4. Request is:
   - Allowed
   - Denied (403)
   - Implicitly denied (if no rule matches)

No Istiod call during request processing – rules are pre-pushed to Envoy.

Basic AuthorizationPolicy Example

Allow traffic **only from `frontend` to `backend`:
```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontend
  namespace: backend
spec:
  selector:
    matchLabels:
      app: backend
  rules:
  - from:
    - source:
        principals:
        - "cluster.local/ns/frontend/sa/frontend-sa"
```
Everything else is denied by default.

Default DENY Behavior (Very Important)

The moment you apply any AuthorizationPolicy to a workload:
Istio switches to “deny by default” mode. This is the #1 reason for production outages.

Real Production Mistake
```yaml
spec:
  rules:
  - to:
    - operation:
        paths: ["/health"]
```
Forgot to allow /api/*. 

Result:
- Health checks pass
- App APIs return 403
- Load balancer keeps traffic flowing → silent outage

DENY Policies (Explicit Blocking)

You can explicitly block traffic:
```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-admin
spec:
  action: DENY
  rules:
  - to:
    - operation:
        paths: ["/admin"]
```
DENY rules are evaluated before ALLOW rules.

Debugging 403 Errors (Real Commands)

Check Envoy Logs
```bash
kubectl logs pod/backend-xxx -c istio-proxy
```
Look for:
```bash
rbac_access_denied
```
Inspect Active Policies in Envoy
```bash
istioctl proxy-config authorization backend-xxx
```
This shows exact rules Envoy is enforcing.

Verify mTLS Identity
```bash
istioctl authn tls-check frontend-xxx backend-xxx
```
If identity is wrong → AuthorizationPolicy will fail.

Best Practices from Production
- Start with audit-only mindset
- Use namespace-scoped policies first
- Avoid * principals in production
- Always allow:
  - /health
  - /metrics
  - readiness endpoints
- Version control policies like application code

- 
