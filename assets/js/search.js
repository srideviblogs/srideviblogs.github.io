document.addEventListener("DOMContentLoaded", function () {
  const desktopSearchInput = document.getElementById("search-input");
  const desktopResultsContainer = document.getElementById("search-results");
  const mobileSearchInput = document.getElementById("mobile-search-input");
  const mobileResultsContainer = document.getElementById("mobile-search-results");

  fetch('/assets/data/posts.json')
    .then(response => response.json())
    .then(posts => {
      function setupSearch(inputElement, resultsContainer) {
        inputElement.addEventListener("input", () => {
          const query = inputElement.value.trim().toLowerCase();
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
          resultsContainer.style.display = 'block';
        });

        document.addEventListener('click', (e) => {
          if (!inputElement.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
          }
        });
      }

      if (desktopSearchInput && desktopResultsContainer) {
        setupSearch(desktopSearchInput, desktopResultsContainer);
      }

      if (mobileSearchInput && mobileResultsContainer) {
        setupSearch(mobileSearchInput, mobileResultsContainer);
      }
    })
    .catch(() => {
      if (desktopResultsContainer) {
        desktopResultsContainer.style.display = 'block';
        desktopResultsContainer.innerHTML = "<p style='padding: 0.5rem;'>Search data could not be loaded.</p>";
      }
      if (mobileResultsContainer) {
        mobileResultsContainer.style.display = 'block';
        mobileResultsContainer.innerHTML = "<p style='padding: 0.5rem;'>Search data could not be loaded.</p>";
      }
    });
});
