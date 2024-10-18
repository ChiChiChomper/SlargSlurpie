document.getElementById('alertButton').addEventListener('click', () => {
  // Display the alert box with the message
  alert("I came.");

  // Call the function to create splots
  createSplots();

  // Show the cleanup button after splots are created
  document.getElementById('cleanupButton').style.display = 'inline-block';
});

function createSplots() {
  // Create 10 splots
  for (let i = 0; i < 10; i++) {
      const splot = document.createElement('div');
      splot.classList.add('splot');

      // Random size and position
      const size = Math.random() * 100 + 50 + 'px';
      const leftPosition = Math.random() * 100 + 'vw';

      splot.style.width = size;
      splot.style.height = size;
      splot.style.left = leftPosition;

      // Add the splot to the body
      document.body.appendChild(splot);

      // Keep splots on screen after animation ends
      splot.addEventListener('animationend', () => {
          splot.style.animation = 'none'; // Freeze the animation
      });
  }
}

// Cleanup function
document.getElementById('cleanupButton').addEventListener('click', () => {
  // Remove all splots from the body
  const splots = document.querySelectorAll('.splot');
  splots.forEach(splot => splot.remove());

  // Hide the cleanup button after cleanup
  document.getElementById('cleanupButton').style.display = 'none';
});
