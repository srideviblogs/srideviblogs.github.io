---
layout: post
title: "Rollback Failed Because Old Artifacts Were Missing: A Jenkins Incident"
date: 2025-06-05 12:00:00 +0000
categories: [cicd]
tags: [cicd, jenkins, rollback, artifacts, production-issues]
image: /assets/images/devops1.jpg
permalink: /cicd/jenkins-rollback-failed-missing-artifacts/
---

A production deployment failed and we attempted a rollback but Jenkins couldn’t find the previous artifacts.  
The rollback failed because old build artifacts were not retained, forcing us to rebuild and redeploy under pressure.

In one of our Jenkins-based CI/CD pipelines, we had a standard flow:
1. Build artifact  
2. Deploy to production  
3. Rollback using the previous artifact if something goes wrong  
This worked well until the day it didn’t.

A production deployment introduced an issue and needed an immediate rollback.
But during rollback:
- Jenkins couldn’t find the previous artifact  
- The artifact URL returned 404 Not Found  
- The rollback job failed

```text
ERROR: Artifact not found
```
No deployment happened. No pods changed. Production stayed broken.
The rollback pipeline could not find the previous build.

Jenkins history showed:
- Multiple successful builds
- Green pipelines
- No cleanup failures
From the UI, everything looked intact but the artifact that production was running no longer existed.

Root Cause
After tracing the pipeline configuration, the issue became clear.

Artifact Retention Policy
Jenkins was configured to:
- Keep only the last 5 builds
- Automatically delete older artifacts to save space
The problematic deployment was build #128.

By the time the rollback was triggered:
- Builds #129–#135 had already run
- Build #128 artifacts had been deleted
- The rollback had nothing to deploy

Jenkins didn’t fail earlier. It did exactly what it was configured to do.

The Fix

1. Separate Retention for Rollback Artifacts
We changed retention rules:
- Short retention for intermediate builds
- Long-term retention for release artifacts
```groovy
options {
  buildDiscarder(logRotator(
    numToKeepStr: '20',
    artifactNumToKeepStr: '10'
  ))
}
```
2. Promote Release Artifacts Explicitly
Only tagged releases are now promoted:
```bash
if [[ "$GIT_TAG" != "" ]]; then
  upload_to_release_repo
fi
```
Release artifacts are stored outside Jenkins.

3. Rollback Uses Artifact Repository, Not Jenkins Workspace
Rollback pipelines now pull from:
> Nexus / Artifactory (preferred)
> S3 / Azure Blob Storage
This made rollbacks independent of Jenkins build retention.

4: Store Artifact Version in Deployment Metadata
Each deployment now records:
- Artifact version
- Build number
- Commit SHA
So rollback knows exactly which artifact to fetch.

Best Practices to Avoid This Issue
- Never rely solely on Jenkins workspace
- Always push artifacts to an external repository
- Retain artifacts longer than build logs
- Automate rollback using artifact versioning
- Test rollback regularly not only deployments

## Final Thoughts

If you’re using Jenkins, make sure your artifacts outlive your builds and rollbacks don’t depend on fragile assumptions.
This small change saved us from future production stress.
