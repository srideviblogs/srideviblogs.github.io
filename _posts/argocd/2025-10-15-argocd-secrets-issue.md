---
layout: post
title: "Argo CD Secrets Not Found: Azure Key Vault Integration Explained"
date: 2025-10-15 
categories: [argocd]
tags: [argocd, secrets, azure, keyvault, debugging]
image: /assets/images/argocd.jpg
permalink: /argocd/argocd-secrets-not-found-azure-key-vault/
---

Argo CD was deployed and applications were syncing correctly, but authentication failed when SSO was enabled.
The Keycloak client secret existed in Azure Key Vault, but Argo CD says Secret not found. 
No Kubernetes Secret appeared in the `argocd` namespace and Argo CD logs showed OIDC failures.

What I Observed Application status in Argo CD:
Sync Status: OutOfSync
Health: Degraded
```text
Sync error:
```
Error: secret "argocd-oidc-client-secret" not found

The confusing part?
The secret was already created in Azure Key Vault.

Step 1: Confirm the Secret Exists in Azure Key Vault
First, I validated the secret was actually present.

```bash
$ az keyvault secret list --vault-name kv-mgmt-dev --query "[].name" -o table
```
Output:
```text
argocd-oidc-client-secret
```
So Azure Key Vault was not the issue.

Step 2: Check Kubernetes Namespace
Next, I checked the Argo CD namespace.
```bash
$ kubectl get secrets -n argocd
```
Output:
```text
No resources found
```
This confirmed the core problem:
The secret was never synced from Key Vault to Kubernetes.
Argo CD cannot read secrets directly from Key Vault. One of the following must exist:
  > External Secrets Operator
  > CSI Secrets Store Driver
  > A custom sync mechanism

Step 3: Understand the Missing Link
In our setup, secrets were supposed to flow like this:
```text
Azure Key Vault
   ↓
Secrets Store CSI Driver
   ↓
Kubernetes Secret
   ↓
Argo CD
```
The CSI sync never happened.

Step 4: Inspect SecretProviderClass
I checked the SecretProviderClass:
```bash
$ kubectl get secretproviderclass -n argocd
```
Found
```text
argocd-secrets
```
Inspecting it:
```yaml
spec:
  provider: azure
  parameters:
    keyvaultName: kv-mgmt-dev
    tenantId: xxxx
  secretObjects:
  - secretName: argocd-oidc-client-secret
    type: Opaque
    data:
    - objectName: argocd-oidc-client-secret
      key: clientSecret
```
At first glance, it looked correct.

Step 5: Check Pod Identity / Managed Identity
Then I checked the pod logs:
```bash
$ kubectl logs -n argocd deploy/argocd-repo-server
```
Error:
```text
ManagedIdentityCredential authentication failed
```
This meant: Argo CD pods did not have permission to read Key Vault secrets.

Step 6: Verify Azure Role Assignment
Checked role assignment:
```bash
$ az role assignment list --assignee <managed-identity-client-id> --scope /subscriptions/.../vaults/kv-mgmt-dev -o table
```
Result:
```text
No role assignments found
```
That was the root cause.

Step 7: Fix — Grant Key Vault Access
Assigned the correct role:
```bash
$ az role assignment create --assignee <managed-identity-client-id> --role "Key Vault Secrets User" --scope /subscriptions/.../vaults/kv-mgmt-dev
```
Step 8: Restart Pods to Trigger Secret Sync
CSI driver syncs secrets only when pods start.
```bash
$ kubectl rollout restart deploy argocd-repo-server -n argocd
$ kubectl rollout restart deploy argocd-server -n argocd
```
After restart:
```bash
$ kubectl get secrets -n argocd
```
Output:
```text
argocd-oidc-client-secret
```
Secret finally appeared.

Step 9: Verify Argo CD Picks It Up
Checked Argo CD config:
```yaml
clientSecret: $argocd-oidc-client-secret
```
Login test:
- SSO worked
- Application synced

Why This Happens in Real Environments
- Secret exists in cloud manager
- CSI driver silently fails
- No Kubernetes secret created
- Argo CD error is misleading
- Logs are spread across components
This makes debugging non-obvious.

## Final Takeaway

If Argo CD says Secret not found:
- Don’t trust cloud secret existence
- Verify Kubernetes secret creation
- Check CSI driver logs & identity
- Restart pods to trigger sync
- Cloud secrets don’t help GitOps unless they reach Kubernetes.

This single issue has broken more SSO and deployments than bad Helm charts ever did.
