document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-input");
  const resultsContainer = document.getElementById("search-results");

  if (!searchInput || !resultsContainer) {
    console.error("Search input or results container not found in the DOM.");
    return;
  }

  fetch("/search.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch search.json");
      }
      return response.json();
    })
    .then((posts) => {
      searchInput.addEventListener("input", function () {
        const query = searchInput.value.trim().toLowerCase();
        resultsContainer.innerHTML = "";

        if (!query) return;

        const results = posts.filter((post) => {
          const titleMatch = post.title.toLowerCase().includes(query);
          const excerptMatch =
            post.excerpt && post.excerpt.toLowerCase().includes(query);
          return titleMatch || excerptMatch;
        });

        if (results.length === 0) {
          resultsContainer.innerHTML = "<p>No results found.</p>";
          return;
        }

        const ul = document.createElement("ul");

        results.forEach((post) => {
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
      console.error("Search error:", error);
      resultsContainer.innerHTML =
        "<p>Search data could not be loaded.</p>";
    });
});
