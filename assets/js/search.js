document.addEventListener("DOMContentLoaded", function () {
  const desktopInput = document.getElementById("search-input");
  const desktopResults = document.getElementById("search-results");

  const mobileInput = document.getElementById("mobile-search-input");
  const mobileResults = document.getElementById("mobile-search-results");

  fetch('/assets/data/posts.json')
    .then(response => response.json())
    .then(posts => {
      function handleSearch(input, resultsContainer) {
        const query = input.value.trim().toLowerCase();
        resultsContainer.innerHTML = "";

        if (query.length === 0) {
          resultsContainer.style.display = 'none';
          return;
        }

        const filtered = posts.filter(post =>
          post.title.toLowerCase().includes(query) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
          resultsContainer.innerHTML = "<p style='padding: 0.5rem;'>No results found.</p>";
        } else {
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
        }

        resultsContainer.style.display = 'block';
      }

      // Attach event listeners to both inputs if they exist
      if (desktopInput && desktopResults) {
        desktopInput.addEventListener("input", () => handleSearch(desktopInput, desktopResults));
      }

      if (mobileInput && mobileResults) {
        mobileInput.addEventListener("input", () => handleSearch(mobileInput, mobileResults));
      }
    })
    .catch(() => {
      if (desktopResults) {
        desktopResults.innerHTML = "<p style='padding: 0.5rem;'>Search data could not be loaded.</p>";
        desktopResults.style.display = 'block';
      }
      if (mobileResults) {
        mobileResults.innerHTML = "<p style='padding: 0.5rem;'>Search data could not be loaded.</p>";
        mobileResults.style.display = 'block';
      }
    });
});
