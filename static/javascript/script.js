var isInfoDivOpen = false;
var videoInfo = {};
var player;
var buttonClickCounter = 0;
var timeCounterStarted = false;

function resetSelections() {
    var videoFormatsSelect = document.getElementById('video_formats');
    videoFormatsSelect.innerHTML = '<option value="">--Select format--</option>';

    var videoQualitySelect = document.getElementById('video_quality');
    videoQualitySelect.innerHTML = '';

    var audioQualitySelect = document.getElementById('audio_quality');
    audioQualitySelect.innerHTML = '';

    // Ocultar los campos de calidad y el botón de descarga
    document.getElementById('quality_selection').style.display = 'none';
    document.getElementById('download_button').style.display = 'none';
}

document.getElementById('video_url').addEventListener('blur', function() {
    var url = this.value.trim();
    var youtubeRegex = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/.+/;

    var button = document.getElementById('get_info_button');
    
    if (url === '') {
        document.getElementById('video_url').value = '';
        button.innerHTML = 'Start';
        return;
    }

    button.innerHTML = '<div class="loader"></div>';

    setTimeout(function() {
        if (url && youtubeRegex.test(url)) {
            console.log("Processing...");
            document.getElementById('get_info_button').click();
        } else {
            button.innerHTML = 'Start';
            console.error('Error: Video URL is empty, undefined, or not a valid YouTube URL');
            var swalPopup = Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'The URL is not a valid YouTube URL!',
                showConfirmButton: false,
            });
            document.getElementById('video_url').value = '';
            setTimeout(function() {
                swalPopup.close();
            }, 3000);
        }
    }, 1000);
});

document.getElementById('get_info_button').addEventListener('click', function() {
    var videoUrl = document.getElementById('video_url').value;
    var button = document.getElementById('get_info_button');

    button.innerHTML = '<div class="loader"></div>';
    button.disabled = true;

    if (!videoUrl) {
        swal.fire('Error', 'Ingrese una URL en el campo', 'error');
        button.innerHTML = 'Start';
        button.disabled = false;
        return;
    }

    if (buttonClickCounter < 1) {
        buttonClickCounter = 1;
        if (!timeCounterStarted) {
            timeCounterStarted = true;
            setTimeout(function() {
                timeCounterStarted = false;
            }, 3000);
        }
    }

    button.disabled = true;

    // Obtener datos previamente almacenados en el LocalStorage
    var storedData = localStorage.getItem('videoInfo');
    if (storedData) {
        // Si hay datos almacenados, cargarlos en la variable videoInfo
        videoInfo = JSON.parse(storedData);
    }

    resetSelections();

    setTimeout(function() {
        fetch('/get_video_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'video_url=' + encodeURIComponent(videoUrl)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                button.innerHTML = 'Start';
                swal.fire('Error', data.message, 'error');
            } else {
                button.innerHTML = 'Start';

                document.getElementById('title').innerText = 'Title: ' + data.title;
                document.getElementById('URL').innerText = 'Video URL: ' + data.video_url;
                document.getElementById('published_date').innerText = 'Published at: ' + data.published_date;
                document.getElementById('channel_name').innerText = 'Channel name: ' + data.channel_name;

                // Limpiamos los select antes de agregar nuevas opciones
                var videoFormatsSelect = document.getElementById('video_formats');
                videoFormatsSelect.innerHTML = '<option value="">--Select format--</option>';

                var videoQualitySelect = document.getElementById('video_quality');
                videoQualitySelect.innerHTML = '';

                var audioQualitySelect = document.getElementById('audio_quality');
                audioQualitySelect.innerHTML = '';

                // Agregamos las opciones al select de video formats
                var videoFormats = data.video_formats.split(', ');
                videoFormats.forEach(format => {
                    var option = document.createElement('option');
                    option.value = format;
                    option.textContent = format;
                    videoFormatsSelect.appendChild(option);
                });

                // Mostrar los campos de calidad una vez que se seleccione un formato
                videoFormatsSelect.addEventListener('change', function() {
                    var selectedFormat = this.value;
                    var videoQualitySelect = document.getElementById('video_quality');
                    var audioQualitySelect = document.getElementById('audio_quality');
                
                    var videoQualities = data.video_quality.split(', ');
                    var audioQualities = data.audio_quality.split(', ');
                
                    videoQualitySelect.innerHTML = '<option value="">--Select video quality--</option>';
                    audioQualitySelect.innerHTML = '<option value="">--Select audio quality--</option>';
                
                    if (selectedFormat) {
                        // Filtrar las opciones de calidad según el formato seleccionado
                        var filteredVideoQualities = videoQualities.filter(quality => quality.includes(selectedFormat));
                        var filteredAudioQualities = audioQualities.filter(quality => quality.includes(selectedFormat));
                
                        filteredVideoQualities.forEach(quality => {
                            var option = document.createElement('option');
                            option.value = quality;
                            option.textContent = quality;
                            videoQualitySelect.appendChild(option);
                        });
                
                        filteredAudioQualities.forEach(quality => {
                            var option = document.createElement('option');
                            option.value = quality;
                            option.textContent = quality;
                            audioQualitySelect.appendChild(option);
                        });
                
                        document.getElementById('quality_selection').style.display = 'block';
                        document.getElementById('download_button').style.display = 'block';
                    } else {
                        document.getElementById('quality_selection').style.display = 'none';
                        document.getElementById('download_button').style.display = 'none';
                    }
                });

                // document.getElementById('video_url').value = '';

                var videoId = getVideoIdFromUrl(data.video_url);
                if (videoId) {
                    if (player) {
                        player.destroy();
                    }
                    player = new YT.Player('player', {
                        height: '360',
                        width: '640',
                        videoId: videoId
                    });
                } else {
                    console.error('Error: Video URL is empty or undefined');
                }

                isInfoDivOpen = true;
                document.getElementById('info_div').style.display = 'block';
                document.getElementById('modalBg').style.display = 'block';

                // Almacenar datos importantes en el LocalStorage
                videoInfo = {
                    title: data.title,
                    published_date: data.published_date,
                    channel_name: data.channel_name,
                    video_quality: data.video_quality,
                    audio_quality: data.audio_quality,
                    video_formats: data.video_formats
                };
                localStorage.setItem('videoInfo', JSON.stringify(videoInfo));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            button.innerHTML = 'Start';
            swal.fire('Error', 'Error occurred while fetching video info.', 'error');
        })
        .finally(() => {
            button.disabled = false;
        });
    }, 2000);
});

function getVideoIdFromUrl(url) {
    var match = url.match(/(?:https?:\/\/)?(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/);
    return (match && match[1].length === 11) ? match[1] : null;
}

document.getElementById('modalBg').addEventListener('click', function() {
    isInfoDivOpen = false;
    document.getElementById('info_div').style.display = 'none';
    document.getElementById('modalBg').style.display = 'none';
    document.getElementById('video_url').value = '';

    if (player && player.pauseVideo) {
        player.pauseVideo();
    }
});

document.getElementById('info_div').addEventListener('click', function(event) {
    event.stopPropagation();
});

document.getElementById('get_info_button').addEventListener('click', function() {
    buttonClickCounter = 1;
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        isInfoDivOpen = false;
        document.getElementById('info_div').style.display = 'none';
        document.getElementById('modalBg').style.display = 'none';
        document.getElementById('video_url').value = '';

        if (player && player.pauseVideo) {
            player.pauseVideo();
        }

    } else if (event.ctrlKey && event.key === 'z' && !isInfoDivOpen && buttonClickCounter === 1 && !timeCounterStarted) {
        document.getElementById('info_div').style.display = 'block';
        document.getElementById('modalBg').style.display = 'block';
        isInfoDivOpen = true;

        if (player && player.playVideo) {
            player.playVideo();
        }
    }
});

const myInput = document.getElementById('video_url');
const myButton = document.getElementById('get_info_button');
myInput.addEventListener('focus', function() {
    myButton.classList.add('focused-border');
});

myInput.addEventListener('blur', function() {
    myButton.classList.remove('focused-border');
});