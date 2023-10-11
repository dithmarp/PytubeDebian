document.getElementById('themeSelector').addEventListener('change', function() {
    const body = document.querySelector('body');
    const elements = document.querySelectorAll('header, #video_url, #get_info_button, .modal-bg, .loader');
    
    body.classList.remove('light-mode', 'dark-mode', 'system-mode');
    elements.forEach(element => {
        element.classList.remove('light-mode', 'dark-mode', 'system-mode');
    });

    const selectedMode = this.value;
    body.classList.add(selectedMode + '-mode');
    elements.forEach(element => {
        element.classList.add(selectedMode + '-mode');
    });
});
document.getElementById('themeSelector').value = 'light';

//Button

const themeSelector = document.getElementById('themeSelector');
const selectedOption = themeSelector.querySelector('.selected-option');
const options = themeSelector.querySelector('.options');

themeSelector.addEventListener('click', () => {
    themeSelector.classList.toggle('open');
});

themeSelector.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', (e) => {
        const value = e.currentTarget.dataset.value; // Cambiado de target a currentTarget
        const icon = e.currentTarget.querySelector('i').outerHTML; // Cambiado de target a currentTarget
        const text = e.currentTarget.textContent.trim(); // Cambiado de target a currentTarget

        changeTheme(value);
        selectedOption.innerHTML = icon + ' ' + text;
    });
});

function changeTheme(value) {
    document.body.className = value + '-mode';
}