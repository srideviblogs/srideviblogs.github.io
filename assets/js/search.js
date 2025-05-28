document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-input");
  const resultsContainer = document.getElementById("search-results");

  fetch('/assets/data/posts.json')
    .then(response => response.json())
    .then(posts => {
      searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        resultsContainer.innerHTML = "";

        if (query.length === 0) {
          resultsContainer.style.display = 'none'; // hide when empty
          return;
        }

        const filtered = posts.filter(post =>
          post.title.toLowerCase().includes(query) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
          resultsContainer.style.display = 'block';
          resultsContainer.innerHTML = "<p style='padding: 0.5rem;'>No results found.</p>";
          return;
        }

        const ul = document.createElement("ul");
        filtered.forEach(post => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = post.url;
          a.textContent = post.title;
          li.appendChild(a);
          ul.appendChild(li);
        });

        resultsContainer.appendChild(ul);
        resultsContainer.style.display = 'block'; // show results
      });

      // Optional: Hide results when clicking outside
      document.addEventListener('click', (e) => {
        if (!document.getElementById('search-container').contains(e.target)) {
          resultsContainer.style.display = 'none';
        }
      });
    })
    .catch(() => {
      resultsContainer.style.display = 'block';
      resultsContainer.innerHTML = "<p style='padding: 0.5rem;'>Search data could not be loaded.</p>";
    });
});
