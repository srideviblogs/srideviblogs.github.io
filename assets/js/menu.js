// Desktop nav toggle (if still needed)
function toggleMenu() {
  const nav = document.getElementById('site-nav');
  nav.classList.toggle('active');
}

// Mobile slide-in menu
function openNav() {
  const sidenav = document.getElementById("mySidenav");
  sidenav.style.width = "250px";
}

function closeNav() {
  const sidenav = document.getElementById("mySidenav");
  sidenav.style.width = "0";
}
