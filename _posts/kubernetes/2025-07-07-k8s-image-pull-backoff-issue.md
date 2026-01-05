---
layout: post
title: "ImagePullBackOff: Why Kubernetes Can’t Fetch Your Image"
date: 2025-07-07 10:00:00 +0000
categories: [kubernetes]
tags: [kubernetes, imagepullbackoff, containers, debugging]
image: /assets/images/kubernetes.jpg
permalink: /kubernetes/imagepullbackoff-cannot-fetch-image/
---

The developer merged a small change. CI ran successfully. The deployment was created. Pods showed up immediately.
But none of them started.

```bash
kubectl get pods
NAME                    READY   STATUS             RESTARTS   AGE
my-app-8c9d7f6b9c-1     0/1     ImagePullBackOff   0          5m
my-app-8c9d7f6b9c-2     0/1     ImagePullBackOff   0          5m
```
No restarts. No logs. Just stuck

ImagePullBackOff means Kubernetes tried to pull the container image but failed and it’s backing off before retrying.

The real reason is always in the Pod events. Checking the Pod Events
```bash
kubectl describe pod myapp-7d6f8c9d7b-qm4zv
```
Near the bottom:
```bash
Warning  Failed     2m (x3 over 5m)  kubelet, node1  Failed to pull image "my-app:2.0": rpc error: code = Unknown desc = Error response from daemon: pull access denied for my-app,
repository does not exist or may require 'docker login'
```
So Kubernetes couldn’t authenticate or find the image.

Inspect the Deployment YAML
The container section looked like this:
```yaml
containers:
  - name: app-container
    image: my-app:2.0
    imagePullPolicy: IfNotPresent
```
I realized the image was hosted on a private registry, so Kubernetes needed credentials to pull it.

Provide Image Pull Secrets
I created a secret with my registry credentials:
```bash
kubectl create secret docker-registry regcred --docker-server=<registry-url> --docker-username=<username> --docker-password=<password> --docker-email=<email>
```
Then updated the deployment to use the secret:
```yaml
spec:
  containers:
    - name: app-container
      image: <registry-url>/my-app:2.0
      imagePullPolicy: IfNotPresent
  imagePullSecrets:
    - name: regcred
```
Apply the Deployment:
```bash
kubectl apply -f my-app-deployment.yaml
kubectl rollout status deployment/my-app
kubectl get pods
```
Now the pods started successfully:
```bash
NAME                    READY   STATUS    RESTARTS   AGE
my-app-8c9d7f6b9c-1     1/1     Running   0          2m
my-app-8c9d7f6b9c-2     1/1     Running   0          2m
```
Additional Debugging Tips

- Check the image pull errors quickly with:
```bash
kubectl describe pod <pod-name>
```
- Ensure the image tag exists in the registry.
- For private registries, make sure imagePullSecrets are set and the secret name matches.

Test pulling the image manually on a node:
```bash
docker pull <registry-url>/my-app:2.0
```

## Key Takeaways

- ImagePullBackOff occurs when Kubernetes cannot fetch the container image.
- Check the pod events for authentication errors, missing tags or registry issues.
- Use imagePullSecrets for private registries.
- Always verify that the image tag exists before deploying to production.
