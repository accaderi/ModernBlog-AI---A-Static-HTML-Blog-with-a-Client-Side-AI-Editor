document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("nav");

  // Check if the elements exist before adding an event listener
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      // Toggles the 'active' class on the nav element
      nav.classList.toggle("active");
    });
  }
});
