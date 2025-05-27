---
layout: default
title: Categories
permalink: /categories/
---

<h1>Browse Posts by Category</h1>

<div class="category-list">
  {% for category in site.categories %}
    <div class="category-card">
      <a href="/categories/{{ category[0] | slugify }}/" class="category-link">
        {{ category[0] }}
      </a>
      <p>{{ category[1].size }} post{{ category[1].size > 1  ? 's' : '' }}</p>
    </div>
  {% endfor %}
</div>
