document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("theme-toggle");
  const currentTheme = localStorage.getItem("theme");

  if (currentTheme === "dark") {
    document.documentElement.classList.add("dark-mode");
  }

  toggleBtn.addEventListener("click", function () {
    document.documentElement.classList.toggle("dark-mode");
    if (document.documentElement.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
});
