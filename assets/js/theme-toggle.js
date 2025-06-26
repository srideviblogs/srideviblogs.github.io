document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("theme-toggle");
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem("theme");

  // Initialize theme
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark-mode");
    toggleBtn.textContent = "☀️"; // Light icon for dark mode
  } else {
    toggleBtn.textContent = "🌙"; // Dark icon for light mode
  }

  // Toggle logic
  toggleBtn.addEventListener("click", function () {
    const isDark = document.documentElement.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    toggleBtn.textContent = isDark ? "☀️" : "🌙";
  });
});
