---
layout: post
title: "Argo CD Repo Access Issues (SSH): How I Debugged a Sudden Production Failure"
date: 2025-10-12 
categories: [argocd]
tags: [argocd, gitops, ssh, debugging, repository]
image: /assets/images/argocd.jpg
permalink: /argocd/argocd-repo-access-ssh-issue/
---

Sometimes, everything works perfectly… and then it suddenly doesn’t. This is exactly what happened in one of our production Argo CD environments. 
Applications that had been syncing fine started showing Error / Unknown states. Nothing deployed. No YAML changes. No cluster issues. Just a silent repo access failure.
Here’s the story of how I tracked down a subtle SSH-based Git repository problem and fixed it.

Argo CD UI showed:
Unable to connect to repository

```text
Application status:
```
ComparisonError

```vbnet
Argo CD logs:

```bash
$ kubectl logs -n argocd deploy/argocd-repo-server

ssh: handshake failed: ssh: unable to authenticate
```
Clearly, Argo CD couldn’t talk to Git anymore. But why?

Identify How the Repository Is Configured
First, I checked whether the repo used SSH or HTTPS:
```bash
$ argocd repo list
```
Output
```yaml
git@github.com:org/my-repo.git
```
So this was clearly SSH-based.

Check the SSH Secret Used by Argo CD
Argo CD stores repository credentials as Kubernetes secrets in the argocd namespace:
```bash
$ kubectl get secrets -n argocd | grep repo
```
Found
```text
repo-github-ssh
```
Inspecting the secret:
```bash
$ kubectl get secret repo-github-ssh -n argocd -o yaml
```
Key part:
```yaml
data:
  sshPrivateKey: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQ==
```
Decoding the key:
```bash
$ kubectl get secret repo-github-ssh -n argocd -o jsonpath='{.data.sshPrivateKey}' | base64 -d
```
The key was expired / rotated in GitHub.

Confirm the Key Is No Longer Valid
I tested manually from inside the repo-server pod:
```bash
$ kubectl exec -n argocd deploy/argocd-repo-server -it -- sh
$ ssh -T git@github.com
```
Output:
```text
Permission denied (publickey).
```
Now it was clear, Argo CD had an old SSH key.

Generate a New SSH Key
I created a dedicated key for Argo CD:
```bash
ssh-keygen -t ed25519 -C "argocd-github"
```
Then I added the public key to GitHub:
```text
Settings → Deploy Keys → Read-only
```
Update the Argo CD Repo Secret
Create or update the secret:
```bash
kubectl create secret generic repo-github-ssh -n argocd --from-file=sshPrivateKey=id_ed25519 --dry-run=client -o yaml | kubectl apply -f -
```
Important: Patch the secret with the required label:
```bash
kubectl label secret repo-github-ssh -n argocd argocd.argoproj.io/secret-type=repository --overwrite
```
Without this label, Argo CD silently ignores the secret.

Restart the Repo Server
Argo CD does not always reload SSH keys dynamically:
```bash
kubectl rollout restart deploy/argocd-repo-server -n argocd
```
Verify Repository Connectivity
```bash
$ argocd repo list
```
Now shows:
```text
STATUS: Successful
```
Application status:
```text
Synced
Healthy
```
Application syncs immediately started working.

Why This Happens in Real Production
- SSH keys are rotated by security teams without always notifying teams.
- Expired keys sit silently in Argo CD secrets.
- Repo-server caches credentials, so the failure only shows up during sync.
- Argo CD does not warn about old or misconfigured secrets — it just fails silently.

Takeaways
- Always check repo-server secrets if Argo CD suddenly loses repo access.
- Use dedicated SSH keys for Argo CD with proper labels.
- Remember to restart the repo-server after updating secrets.
- Consider monitoring repo connectivity proactively using Argo CD CLI or alerts
  
