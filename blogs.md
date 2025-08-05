---
layout: default
title: Blogs
permalink: /blogs/
---

<div class="grid-blog-list">
  {% for post in site.posts %}
    <div class="grid-blog-item">
      <p class="blog-meta">Sridevi Velpula · {{ post.date | date: "%B %d, %Y" }}</p>
      <h3 class="blog-title"><a href="{{ post.url }}">{{ post.title }}</a></h3>
      <p class="blog-excerpt">{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
    </div>
  {% endfor %}
</div>
