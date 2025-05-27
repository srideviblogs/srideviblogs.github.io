---
layout: default
title: Blogs
permalink: /blogs/
---

<h1>All Blog Posts</h1>

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a> — {{ post.date | date: "%b %-d, %Y" }}
      <p>{{ post.excerpt | strip_html | truncate: 120 }}</p>
    </li>
  {% endfor %}
</ul>
