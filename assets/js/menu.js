function toggleMenu() {
  const nav = document.getElementById('site-nav');
  const body = document.body;

  if (nav.classList.contains('active')) {
    nav.classList.remove('active');
    body.style.overflow = '';
  } else {
    nav.classList.add('active');
    body.style.overflow = 'hidden';
  }
}
