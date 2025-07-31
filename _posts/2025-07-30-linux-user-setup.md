---
layout: post
title: "Interactive vs Non-Interactive Shells in Linux - DevOps 100 Days Challenge"
date: 2025-07-30 12:00:00 +0000
categories: [100-days-devops]
tags: [linux, shell, devops, security]
excerpt: "Learn the difference between interactive and non-interactive shells in Linux, with a practical example for creating users with non-interactive shells."
image: /assets/images/devops.jpg
---

<div style="background-color:#e2f4ff; color:#007acc; display:inline-block; padding:6px 12px; border-radius:6px; font-weight:bold; font-size:14px; margin-bottom:20px;">
Day 1 of 100 — DevOps Challenge
</div>

As I kick off my **100 Days of DevOps** journey, I wanted to start with something simple but essential — the difference between **interactive** and **non-interactive shells** in Linux.

It might sound simple, but this idea is actually a key part of how automation, security, and system management work smoothly in DevOps. Let’s break it down in a way that’s easy to understand and useful for everyday work. 
---

## What Exactly is a Shell?

A shell is a program that lets you talk to your Linux system. You type commands — it executes them.

It’s the interface between *you* and the *operating system*.

---

## What is an Interactive Shell?

An **interactive shell** is what you get when you open a terminal or SSH into a server. It:

- Waits for your input.
- Shows a prompt (like `$` or `#`).
- Supports handy features like tab completion and command history.
- Loads your configs like `.bashrc` or `.zshrc`.

Basically, if you’re typing commands in real time — you’re in an interactive shell.

---

## What is a Non-Interactive Shell?

A **non-interactive shell**, on the other hand, runs commands without needing you to type anything. It:

- Doesn't show a prompt.
- Executes scripts or scheduled tasks (like cron jobs).
- Doesn’t load interactive configs by default.
- Often used for automation or restricting login access.

So when you run a shell script, that’s a non-interactive shell in action.

---

## When Do You Use Each?

| Shell Type           | When to Use It                               |
|----------------------|----------------------------------------------|
| **Interactive**      | Manual command-line work, debugging, admin tasks |
| **Non-Interactive**  | Automation, cron jobs, service users, restricting login |

---

## Practical Example: Creating a Linux User with a Non-Interactive Shell

Suppose you need to create a user account on a system, but you want to prevent that user from logging in interactively. Here’s how I did that on **App Server 1** by creating a user named `jim`:

```bash
thor@jumphost ~$ ssh tony@stapp01
The authenticity of host 'stapp01 (172.16.238.10)' can't be established.
ED25519 key fingerprint is SHA256:n9qmJzWE91nIfTFwxJn13ELNuFWsgeGeSIlrU1fkU7I.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'stapp01' to the list of known hosts.
tony@stapp01's password:

[tony@stapp01 ~]$ sudo su -

[sudo] password for tony:

[root@stapp01 ~]# useradd -s /usr/sbin/nologin jim
[root@stapp01 ~]# grep jim /etc/passwd
jim:x:1002:1002::/home/jim:/usr/sbin/nologin
```

## What’s Happening Here?

- The command useradd -s /usr/sbin/nologin jim creates a new user jim but assigns a non-interactive shell.
- /usr/sbin/nologin is a special shell that simply denies login. When jim tries to log in, they’ll be politely rejected.
- This is perfect for service accounts that don’t need shell access.

## Why Does This Matter in DevOps?

- It’s a security best practice to disable interactive shells for system or automation users.
- It ensures users can perform tasks (like running a backup job) without giving them full shell access.
- Understanding this helps when writing scripts, designing user permissions, and automating Linux tasks responsibly.

Thanks for reading! This was Day 1 of my 100-day DevOps challenge.
Stay tuned for the next topic, where I’ll explore more practical and foundational DevOps skills.
