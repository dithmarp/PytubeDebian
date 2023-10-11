//Recarga

function refreshPage() {
    window.location.reload(true);
}
  
document.addEventListener('keydown', function(event) {
    if (event.key === 'F5') {
        document.getElementById('video_url').value = '';
        refreshPage();
    }
});