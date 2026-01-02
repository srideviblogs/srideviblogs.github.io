---
layout: post
title: "Argo CD SSO Login Failure with Keycloak: Debugging a Redirect URI Mismatch"
date: 2025-10-19 
categories: [argo cd]
tags: [argocd, keycloak, sso, oidc, kubernetes, aks, eks]
image: /assets/images/argocd.jpg
permalink: /argocd/sso
---

When we tried enabling SSO via Keycloak for Argo CD, everything looked correct on paper:
- Keycloak realm created
- Client for Argo CD created
- Redirect URIs configured
- Secret pushed to Azure Key Vault / AWS Secrets Manager

Yet, login attempts kept looping back to the login page, or failed with: Trying to log in via SSO:
```
Keycloak UI error:
```
invalid redirect_uri

Argo CD logs:
```bash
$ kubectl logs -n argocd deploy/argocd-server
```
Error:
```text
oidc: failed to exchange token: redirect_uri mismatch
```

Step 1: Confirm Argo CD Is Using OIDC
Checked argocd-cm:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  oidc.config: |
    name: Keycloak
    issuer: https://keycloak.example.com/realms/platform
    clientID: argocd
    clientSecret: $argocd-oidc-client-secret
    requestedScopes: ["openid", "profile", "email"]
```
OIDC config looked correct.

Step 2: Identify the Redirect URI Argo CD Uses
Argo CD constructs redirect URLs dynamically.
For our setup:
```text
https://argocd.example.com/auth/callback
```
Any mismatch (trailing slash, HTTP vs HTTPS) → login loop.

Step 3: Check Keycloak Client Configuration
In Keycloak:
```text
Clients → argocd → Settings → Valid Redirect URIs
```
I found this:
```text
Valid Redirect URIs:
  https://argocd.example.com/*
```
At first glance, this looked fine.

But our Argo CD was accessed via:
```text
https://argocd.prod.example.com
```
Mismatch between actual URL and Keycloak redirect URI.

Step 4: Confirm Using Logs (Critical Step)
Back to Argo CD logs:
```bash
$ kubectl logs -n argocd deploy/argocd-server | grep redirect
```
Output
```text
redirect_uri=https://argocd.prod.example.com/auth/callback
```
Keycloak only allowed:
```text
https://argocd.example.com/*
```
That was the problem.

Step 5: Fix — Update Redirect URI in Keycloak
Updated Keycloak client:
```text
Valid Redirect URIs:
  https://argocd.prod.example.com/auth/callback
```
Also updated:
```text
Web Origins:
  https://argocd.prod.example.com
```
Saved changes.

Step 6: Restart Argo CD Server
```bash
$ kubectl rollout restart deploy argocd-server -n argocd
```
Step 7: Test Login
- Click Login via Keycloak
- Redirects correctly
- Token exchange successful
- UI loads
Login restored.

## Final Takeaway

If Argo CD SSO fails:
- Ignore UI error messages
- Check argocd-server logs
- Verify exact redirect URI
- Match it character-for-character
   > One character mismatch can lock out your entire GitOps platform.

This single issue caused more downtime than any Argo CD upgrade we’ve done.
