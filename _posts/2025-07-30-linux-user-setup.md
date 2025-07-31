---
layout: post
title: "Interactive vs Non-Interactive Shells in Linux — DevOps 100 Days Challenge"
date: 2025-07-30 12:00:00 +0000
categories: [devops, linux]
tags: [linux, shell, devops, security]
excerpt: "Learn the difference between interactive and non-interactive shells in Linux, with a practical example for creating users with non-interactive shells."
image: /assets/images/devops.jpg
---

Understanding the difference between **interactive** and **non-interactive shells** is crucial for every DevOps engineer. In this post, I will explain what they are, when to use each, and provide a real-world example — creating a Linux user named `jim` with a non-interactive shell on App Server 1.

---

## What is a Shell?

A shell is a program that provides a command-line interface to interact with the operating system. It interprets and executes commands you type.

---

## Interactive Shell

- Waits for your input.
- Shows a prompt (e.g., `$` or `#`).
- Supports command history, tab completion, and command editing.
- Loads configuration files like `.bashrc` or `.zshrc`.
- Used when you log into a system via terminal or SSH.

---

## Non-Interactive Shell

- Runs scripts or commands without user input.
- No command prompt is shown.
- Often used for running automated jobs like cron tasks or service accounts.
- Does **not** load interactive shell configs.
- Useful for security to prevent shell login.

---

## When to Use Each?

| Shell Type           | When to Use                               |
|----------------------|------------------------------------------|
| Interactive Shell    | Day-to-day command line use and debugging |
| Non-Interactive Shell | Automated scripts, cron jobs, restricted users |

---

## Practical Example: Creating User `jim` with Non-Interactive Shell on App Server 1

Here’s a sample real SSH session showing how to create user `jim` with the `/usr/sbin/nologin` shell:

```bash
thor@jumphost ~$ ssh tony@stapp01
The authenticity of host 'stapp01 (172.16.238.10)' can't be established.
ED25519 key fingerprint is SHA256:n9qmJzWE91nIfTFwxJn13ELNuFWsgeGeSIlrU1fkU7I.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'stapp01' (ED25519) to the list of known hosts.
tony@stapp01's password: 

[tony@stapp01 ~]$ sudo su -

We trust you have received the usual lecture from the local System Administrator. It usually boils down to these three things:

    #1) Respect the privacy of others.
    #2) Think before you type.
    #3) With great power comes great responsibility.

[sudo] password for tony: 

[root@stapp01 ~]# pwd
/root
[root@stapp01 ~]# useradd -s /usr/sbin/nologin jim
[root@stapp01 ~]# cat /etc/passwd | grep jim
jim:x:1002:1002::/home/jim:/usr/sbin/nologin

## Explanation

- useradd -s /usr/sbin/nologin jim creates user jim with the nologin shell.
- This means jim cannot login interactively, which is ideal for service accounts or users restricted from shell access.
- /usr/sbin/nologin prevents interactive shell login but allows running non-interactive tasks if needed.

## Why This Matters in DevOps

-  Ensuring users or service accounts have appropriate shell access is a security best practice.
- Prevents unauthorized access while allowing necessary automation.
- Understanding shell types helps in scripting, automation, and managing user permissions effectively.

Stay tuned for more DevOps essentials in this 100 days challenge!
