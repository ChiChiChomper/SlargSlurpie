document.addEventListener('DOMContentLoaded', () => {
    console.log('Slargnarg site is ready!');

    const themeSwitcher = document.getElementById('theme-switcher');
    const botLink = document.querySelector('li a[href="bum/templates/index.html"]');

    // Function to set theme by loading a CSS file
    function setTheme(theme) {
        const themeLink = document.getElementById('theme-link');
        if (themeLink) {
            themeLink.href = `css/${theme}-theme.css`;
        } else {
            console.error("Theme link element not found");
        }
        localStorage.setItem('theme', theme);
    }

    // Event listener for theme switcher
    if (themeSwitcher) {
        themeSwitcher.addEventListener('change', (e) => {
            setTheme(e.target.value);
        });

        // Load saved theme on page load
        const savedTheme = localStorage.getItem('theme') || 'light';
        themeSwitcher.value = savedTheme;
        setTheme(savedTheme);
    } else {
        console.error("Theme switcher element not found");
    }

    // Add event listener to "Bot" link
    if (botLink) {
        botLink.addEventListener('click', (e) => {
            alert("The bot is currently down. Please try again later.");
            // Optional: Prevent the default link behavior to stay on the page
            e.preventDefault(); 
        });
    } else {
        console.error("Bot link not found");
    }
});
