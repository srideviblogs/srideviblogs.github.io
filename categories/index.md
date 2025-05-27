---
layout: page
title: Categories
permalink: /categories/
---

# Explore by Category

<ul>
{% for category in site.categories %}
  <li>
    <a href="{{ site.baseurl }}/blogs/#{{ category[0] | slugify }}">{{ category[0] }} ({{ category[1].size }})</a>
  </li>
{% endfor %}
</ul>
