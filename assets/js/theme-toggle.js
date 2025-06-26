document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Determine initial theme
  const shouldUseDark = savedTheme === "dark" || (!savedTheme && prefersDark);

  if (shouldUseDark) {
    document.documentElement.classList.add("dark-mode");
    toggleBtn.textContent = "🌙"; // Currently in dark mode, show moon
  } else {
    document.documentElement.classList.remove("dark-mode");
    toggleBtn.textContent = "☀️"; // Currently in light mode, show sun
  }

  toggleBtn.addEventListener("click", function () {
    const isDark = document.documentElement.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    toggleBtn.textContent = isDark ? "🌙" : "☀️"; // 🌙 = dark, ☀️ = light
  });
});
