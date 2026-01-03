---
layout: post
title: "Ingress Works in One Namespace but Not Another: A Kubernetes Mystery"
date: 2025-07-11 10:00:00 +0000
categories: [kubernetes]
tags: [kubernetes, ingress, networking, troubleshooting]
image: /assets/images/kubernetes.jpg
permalink: /kubernetes/ingress
---

Recently, I deployed an Ingress resource for a new service. It worked perfectly in the `dev` namespace, but when I tried the same configuration in `staging`, traffic wasn’t reaching the pods.  

Running:

```bash
kubectl get ingress -n dev
NAME          CLASS    HOSTS           ADDRESS        PORTS
myapp-ing     nginx    myapp.dev.com   10.10.10.10    80
```
But in staging:
```bash
kubectl get ingress -n staging
NAME          CLASS    HOSTS           ADDRESS        PORTS
myapp-ing     nginx    myapp.staging.com   <pending>   80
```
DNS resolved, but accessing the app timed out.

First Check: Controller Logs
```bash
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller
```
In dev:
```bash
Ingress myapp-ing configured successfully
```
In staging:
```bash
No Ingress found for namespace staging
```
Inspecting the Ingress Resource
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ing
  namespace: staging
spec:
  ingressClassName: nginx
  rules:
    - host: myapp.staging.com
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: myapp
              port:
                number: 80
```
Looks correct, right?

The Subtle Difference
The IngressClassName nginx was restricted to the dev namespace in the controller’s config:
```yaml
controller:
  watchNamespace: dev
```
So the ingress in staging was ignored entirely.

Fixing the Issue

Option 1 – Allow the controller to watch all namespaces:
```yaml
controller:
  watchNamespace: ""
```
Option 2 – Deploy a separate ingress controller for staging.
I applied Option 1 for simplicity.

Verifying the Fix
```bash
kubectl get ingress -n staging
NAME          CLASS    HOSTS               ADDRESS
myapp-ing     nginx    myapp.staging.com   10.10.10.11
```
Traffic flowed immediately:
```bash
curl http://myapp.staging.com
# 200 OK
```

Additional Debugging Tips
- Ingress resources are namespace-scoped, while ingress controllers watch multiple namespaces depending on configuration.
- Always double-check the service namespace referenced by the Ingress backend.
- Use `kubectl describe ingress -n <namespace>` to spot backend errors.
- Check controller logs for warnings like “service not found” or “no endpoints available.”

## Key Takeaways

- An Ingress can exist but fail to route traffic if the backend service is in a different namespace.
- Always ensure the Ingress and the service are in the same namespace unless the controller is configured for cross-namespace routing.
- Check controller logs and service endpoints when troubleshooting Ingress issues.
