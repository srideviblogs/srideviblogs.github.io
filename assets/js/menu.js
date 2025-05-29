function toggleMenu() {
  const nav = document.getElementById('site-nav');
  const body = document.body;

  nav.classList.toggle('active');
  body.classList.toggle('menu-open');
}
