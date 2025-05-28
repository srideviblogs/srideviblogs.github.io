document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-input");
  const resultsContainer = document.getElementById("search-results");

  if (!searchInput || !resultsContainer) {
    console.error("Search input or results container not found in the DOM.");
    return;
  }

  fetch('/assets/data/posts.json')
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load posts.json");
      }
      return response.json();
    })
    .then(posts => {
      console.log("Posts loaded:", posts);

      searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        resultsContainer.innerHTML = "";

        if (!query) return;

        const filtered = posts.filter(post =>
          (post.title && post.title.toLowerCase().includes(query)) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
          resultsContainer.innerHTML = "<p>No results found.</p>";
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
      });
    })
    .catch((error) => {
      console.error("Error loading or parsing posts.json:", error);
      resultsContainer.innerHTML = "<p>Search data could not be loaded.</p>";
    });
});
