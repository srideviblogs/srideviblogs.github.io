---
layout: default
title: Blogs
permalink: /blogs/
---

<h1>All Blog Posts</h1>

<div class="simple-blog-list">
  {% for post in site.posts %}
    <div class="simple-blog-item">
      <p class="blog-meta">Sridevi Velpula · {{ post.date | date: "%B %d, %Y" }}</p>
      <h3 class="blog-title"><a href="{{ post.url }}">{{ post.title }}</a></h3>
      <p class="blog-excerpt">{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
    </div>
  {% endfor %}
</div>
