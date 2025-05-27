---
layout: page
title: Categories
permalink: /categories/
---

# Browse Posts by Category

<ul>
  {% assign sorted_categories = site.categories | sort %}
  {% for category in sorted_categories %}
    <li>
      <a href="{{ '/categories/' | append: category[0] | slugify | append: '/' }}">
        {{ category[0] | capitalize }} ({{ category[1].size }})
      </a>
    </li>
  {% endfor %}
</ul>
