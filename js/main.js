// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach((el) => observer.observe(el));

// Stagger reveal for grid children
document.querySelectorAll('.services-grid, .projects-grid, .testimonials-grid, .process-steps').forEach((grid) => {
  Array.from(grid.children).forEach((child, i) => {
    child.style.transitionDelay = `${i * 0.08}s`;
    child.classList.add('reveal');
    observer.observe(child);
  });
});
