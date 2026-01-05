---
layout: post
title: "Jenkins Built a New Image, But Deployed an Old One – A Docker Cache Incident"
date: 2025-06-02 12:00:00 +0000
categories: [cicd]
tags: [cicd, pipelines, jenkins, docker]
image: /assets/images/devops1.jpg
permalink: /cicd/jenkins-pipeline-docker
---

This is another real CI/CD issue I faced while using Jenkins with Docker. The Jenkins pipeline was successful.  
A new Docker image was supposedly built. Deployment completed without errors.
But production was still running old code. This time, the culprit was Docker layer caching.

We were using Jenkins to:
1. Build a Docker image
2. Push it to a private registry
3. Deploy the image to a VM-based service
The Jenkins agent had Docker installed and reused across jobs.

On every pipeline run:
- Docker should build a fresh image
- New application code should be included
- Registry should contain the latest image
- Deployment should use the new image

Jenkins showed:
Finished: SUCCESS

So I expected production to be updated.

What Actually Happened

After deployment:
- Application behavior didn’t change
- Logs were identical to the previous version
- Version endpoint returned the old value

Once again:
Pipeline success, wrong outcome

Investigation – What I Checked

Step 1: Jenkins Console Output
The Docker build stage showed:
```bash
docker build -t myapp:latest .
```
The logs looked normal and ended with:
```text
Successfully built 8f3a9c1b2e4d
Successfully tagged myapp:latest
```
No errors at all.

Step 2: Check Image Creation Time
On the Jenkins agent, I checked the image:
```bash
docker images myapp
```
Output:
```bash
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
myapp        latest    8f3a9c1b2e4d    3 days ago     450MB
```
This was the red flag. The image was not newly created.

Docker reused cached layers. Why?
Because:
- The Dockerfile had not changed
- The COPY instruction was placed after dependency installation
- Docker detected no change and reused layers

So even though Jenkins ran the build command:
- Docker did not rebuild the application layer
- Old binaries were reused
- A new image tag pointed to old content

Jenkins marked the stage as SUCCESS because:
- Docker command succeeded
- No failure occurred

Why This Is Dangerous
- Image tag was updated
- Registry push succeeded
- Deployment pulled the image
- But the image content was stale
This is one of the most misleading CI/CD failures.

Fix 1: Reorder Dockerfile Instructions
Before:
```dockerfile
FROM openjdk:17
RUN mvn clean install
COPY . /app
```
After:
```dockerfile
FROM openjdk:17
COPY . /app
RUN mvn clean install
```
This ensured code changes invalidated the cache.

Fix 2: Disable Cache in Jenkins (Short-Term)
```bash
docker build --no-cache -t myapp:${BUILD_NUMBER} .
```
Fix 3: Use Immutable Image Tags
Instead of latest, we switched to:
```bash
docker build -t myapp:${GIT_COMMIT} .
docker push myapp:${GIT_COMMIT}
```
Verification
After deployment, I verified the running version:
```bash
curl http://prod-app-url/version
```
This time, production reflected the latest commit.

Lessons Learned
- Docker cache can silently break CI/CD
- Never trust latest in production
- Use immutable tags (commit ID or build number)
- Validate image creation time during debugging

## Final Thoughts

The pipeline did everything it was told to do. The problem was what it didn’t do.
This incident reminded me that CI/CD failures are often logical, not technical.


