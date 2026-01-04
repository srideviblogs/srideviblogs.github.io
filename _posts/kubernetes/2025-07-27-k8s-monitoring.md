---
layout: post
title: "Monitoring Your Kubernetes Cluster: How We Caught a Silent Failure in Production"
date: 2025-07-27 10:00:00 +0000
categories: kubernetes
tags: [kubernetes, monitoring, production-issues, observability]
image: /assets/images/kubernetes.jpg
permalink: /kubernetes/monitoring
---

This happened during a peak traffic window in production. A web application was deployed across multiple clusters.  
Everything looked healthy:
```bash
kubectl get pods -n webapp
NAME                        READY   STATUS    RESTARTS
webapp-7d9f8c6b5d-abc12     1/1     Running   0
webapp-7d9f8c6b5d-def34     1/1     Running   0
```
Node status was green, PVCs were Bound, services existed.

But our monitoring alerts started firing:
- HPA was not scaling despite traffic spiking to 3x the normal load
- One of the StatefulSet pods for the database showed intermittent CrashLoopBackOff for a few seconds then recovered silently
- A key API endpoint had missing endpoints in the Service, causing random 503 errors

Why This Was Confusing
- No pods were failing permanently
- Logs inside containers looked normal
- CI/CD pipelines reported successful deployments
  
If we hadn’t had metrics and alerts, users would have noticed errors before we did. The failure was silent pods appeared Running, but the system was partially degraded.

After digging into Prometheus metrics and pod events:

HPA Misconfiguration:
- CPU metrics were collected in the wrong namespace
- HPA did not trigger because targetCPUUtilizationPercentage was never reached according to the metric server

Database Pod CrashLoopBackOff:
- PVC was attached correctly, but the pod occasionally tried to mount a volume on a node that had been cordoned temporarily
- Pod recovered after node scheduling became available, but the short crashes caused temporary downtime for API requests

Service Endpoint Flapping:
- One pod failed readiness probes briefly due to the database crash
- Kubernetes removed it from the Service endpoints
- Some API requests were routed to pods without DB connectivity, causing 503s

Monitoring doesn’t just alert on permanent failures it catches silent, intermittent issues.
Pods may be Running, services may exist and deployments may be successful but without metrics and alerts, partial degradation goes unnoticed.

How We Fixed It
1. Correct HPA Metrics
Updated HPA to reference the correct namespace metrics:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: webapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webapp
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
```
Stabilize Database Pods:
- Tolerations added for cordoned nodes
- PVC scheduling ensured with WaitForFirstConsumer awareness

Improved Alerts:
- Added short-duration pod flapping alerts
- Monitored Service endpoints for missing pods
Slack and Teams notifications for partial degradations, not just complete failures

When monitoring Kubernetes clusters:
- Always verify metrics namespace and target
- Track pod flapping, not just pod down
- Check HPA behavior under load
- Observe Service endpoints for partial connectivity
- Set short-duration alerts for transient failures

Monitoring is not just about green dashboards. It’s about catching silent, intermittent failures before they impact users.
Even if everything looks Running, Kubernetes may be quietly misbehaving metrics will tell the real story.
