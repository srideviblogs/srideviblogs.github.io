---
layout: post
title: "Jenkins Pipeline Succeeded, But the Build Was Never Updated"
date: 2025-06-02 12:00:00 +0000
categories: [cicd]
tags: [cicd, pipelines, jenkins, devops]
image: /assets/images/devops1.jpg
permalink: /cicd/jenkins
---
This happened during a routine Jenkins-driven release.

A code change was merged.
Jenkins automatically triggered the pipeline.

- Checkout stage succeeded
- Build stage succeeded
- Image build completed
- Pipeline ended green

Everyone assumed the new build was created and deployed.

Later that day, a production issue was reported —  
the behavior matched **old code**, not the latest commit.
