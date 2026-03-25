document.addEventListener('DOMContentLoaded', () => {
  const rocket = document.querySelector('.rocket');
  const smokeContainer = document.querySelector('.smoke-container');

  function spawnSmoke() {
    const rect = rocket.getBoundingClientRect();
    const smoke = document.createElement('div');
    smoke.classList.add('smoke');

    // letakkan asap tepat di belakang roket
    smoke.style.left = (rect.left + rect.width / 2 - 10) + 'px';
    smoke.style.top = (rect.top + rect.height / 2) + 'px';

    smokeContainer.appendChild(smoke);

    setTimeout(() => smoke.remove(), 2000);
  }

  setInterval(spawnSmoke, 200);

  // klik roket pindah dashboard
  rocket.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
});
