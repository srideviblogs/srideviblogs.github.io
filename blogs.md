---
layout: page
title: Blogs
permalink: /blogs/
---

{% for post in site.posts %}
<div style="margin-bottom: 30px;">
  <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
  <p><em>{{ post.date | date: "%B %d, %Y" }}</em></p>
  <p>{{ post.excerpt }}</p>
</div>
{% endfor %}
