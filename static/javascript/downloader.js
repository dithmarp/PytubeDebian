function downloadVideo() {
    var video_url = document.getElementById('video_url').value;

    var video_quality = document.getElementById('video_quality').value;
    var video_format = document.getElementById('video_formats').value;
    var audio_quality = document.getElementById('audio_quality').value;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/download_video', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.error) {
                    alert(response.message);
                } else {
                    var downloadConfirmation = confirm('Video Downloaded Successfully! The download link will expire in 5 minutes. Click "OK" to download the video now.');
                    if (downloadConfirmation) {
                        window.location.href = response.download_url;
                    } else {
                        deleteFileFromServer(response.download_url);
                    }
                }
            } else {
                alert('An error occurred during the download.');
            }
        }
    };

    xhr.send('video_url=' + encodeURIComponent(video_url) + '&video_quality=' + encodeURIComponent(video_quality) + '&video_format=' + encodeURIComponent(video_format) + '&audio_quality=' + encodeURIComponent(audio_quality));
}

function deleteFileFromServer(fileUrl) {
    var xhrDelete = new XMLHttpRequest();
    xhrDelete.open('POST', '/delete_file', true);
    xhrDelete.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhrDelete.onreadystatechange = function() {
        if (xhrDelete.readyState === 4 && xhrDelete.status === 200) {
            var responseDelete = JSON.parse(xhrDelete.responseText);
            alert(responseDelete.message);
        }
    };

    xhrDelete.send('file_url=' + encodeURIComponent(fileUrl));
}