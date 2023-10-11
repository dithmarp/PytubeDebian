// Función para establecer una cookie
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; SameSite=Lax; path=/";
  }
  
  // Función para obtener una cookie
  function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
  
  // Al cargar la página, se recupera la elección del usuario de las cookies
  document.addEventListener('DOMContentLoaded', function() {
    const selectedMode = getCookie('selectedMode');
    if (selectedMode) {
      changeTheme(selectedMode);
      updateSelectedOption(selectedMode);
    }
  });
  
  // Evento para manejar el cambio de modo
  document.getElementById('themeSelector').querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', (e) => {
      const value = e.currentTarget.dataset.value;
  
      // Guarda la elección del usuario en una cookie
      setCookie('selectedMode', value, 365); // Guarda la elección durante 365 días
  
      changeTheme(value);
      updateSelectedOption(value);
    });
  });

function updateSelectedOption(value) {
    const themeSelector = document.getElementById('themeSelector');
    const selectedOption = themeSelector.querySelector('.selected-option');
    const option = themeSelector.querySelector(`.option[data-value="${value}"]`);
    const icon = option.querySelector('i').outerHTML;
    const text = option.textContent.trim();
    selectedOption.innerHTML = icon + ' ' + text;
  }

  // Función para cambiar el tema
function changeTheme(value) {
    const body = document.querySelector('body');
    const elements = document.querySelectorAll('header, #video_url, #get_info_button, .modal-bg, .loader');
    
    body.classList.remove('light-mode', 'dark-mode', 'system-mode');
    elements.forEach(element => {
        element.classList.remove('light-mode', 'dark-mode', 'system-mode');
    });
  
    body.classList.add(value + '-mode');
    elements.forEach(element => {
        element.classList.add(value + '-mode');
    });
  }