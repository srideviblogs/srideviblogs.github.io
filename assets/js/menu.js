document.addEventListener("DOMContentLoaded", function() {
  const hamburger = document.getElementById("hamburger");
  const sidenav = document.getElementById("mySidenav");
  const closebtn = document.getElementById("closebtn");

  hamburger.addEventListener("click", function() {
    sidenav.style.width = "250px";
  });

  closebtn.addEventListener("click", function() {
    sidenav.style.width = "0";
  });

  // Optional: close menu if user clicks outside the menu on mobile
  window.addEventListener("click", function(event) {
    if (event.target !== sidenav && event.target !== hamburger && !sidenav.contains(event.target)) {
      sidenav.style.width = "0";
    }
  });
});
