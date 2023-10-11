from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from bs4 import BeautifulSoup
from pytube import YouTube
from pathlib import Path

import certifi
import threading
import time
import os
import requests
import re
import json
import subprocess

def delete_file_after_delay(file_path, delay=300):
    def delete_file():
        time.sleep(delay)
        try:
            os.remove(file_path)
            print(f"Archivo '{file_path}' eliminado con éxito.")
        except Exception as e:
            print(f"No se pudo eliminar el archivo '{file_path}'. Error: {e}")

    threading.Thread(target=delete_file).start()

class YoutubeScraper:
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36'}

    def __init__(self, url):
        self.url = url
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)
        self.response = self.soup = self.data = None
        self.title = self.published_date = self.channel_name = None
        self.audio_qualities = self.video_qualities = self.video_formats = None

    def fetch_html(self):
        self.response = self.session.get(self.url, verify=certifi.where())
        self.soup = BeautifulSoup(self.response.text, 'html.parser')

    def extract_metadata(self):
        import ssl
        ssl._create_default_https_context = ssl._create_unverified_context
        self.title = self.soup.find("meta", itemprop="name")['content']
        self.published_date = self.soup.find("meta", itemprop="datePublished")['content']
        data = re.search(r"var ytInitialData = ({.*?});", self.soup.prettify()).group(1)
        self.data = json.loads(data)

        video_info = self.data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1]['videoSecondaryInfoRenderer']
        self.channel_name = video_info['owner']['videoOwnerRenderer']['title']['runs'][0]['text']

        yt = YouTube(self.url)
        video_streams = yt.streams.filter(only_video=True)
        audio_streams = yt.streams.filter(only_audio=True)

        self.video_qualities = [f"{stream.resolution} ({stream.mime_type.split('/')[-1]})"
                                for stream in video_streams]
        self.audio_qualities = [f"{stream.abr} ({stream.mime_type.split('/')[-1]})"
                                for stream in audio_streams]
        self.video_formats = set([stream.mime_type.split('/')[-1] for stream in video_streams])

    def original_title_video(self):
        return self.title

    @staticmethod
    def is_ffmpeg_available():
        try:
            subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except FileNotFoundError:
            return False

    def safe_filename(filename):
        invalid_chars = r'[\\/*?:"<>|]'
        return re.sub(invalid_chars, '-', filename)

    def download_video(self, quality, video_format, audio_quality):
        res, audio_abr = quality.split(" ")[0], audio_quality.split(" ")[0]
        yt = YouTube(self.url)
        video_stream = yt.streams.filter(res=res, file_extension=video_format).first()
        audio_stream = yt.streams.filter(abr=audio_abr, file_extension=video_format).first()

        download_folder = str(Path.home() / "Downloads/Youtube_download")
        if not os.path.exists(download_folder):
            os.makedirs(download_folder)
        original_title = YoutubeScraper.safe_filename(self.title)
        video_filename = f"{original_title}(Video).{video_format}"
        audio_filename = f"{original_title}(Audio).{video_format}"

        video_path = video_stream.download(output_path=download_folder, filename=video_filename)
        audio_path = audio_stream.download(output_path=download_folder, filename=audio_filename)

        safe_title = re.sub(r"[^a-zA-Z0-9_\-. ]+", "", self.title)
        final_output = os.path.join(download_folder, f"{safe_title}.{video_format}")

        if video_format == 'webm' and audio_stream.mime_type.split('/')[-1] != 'webm':
            converted_audio_path = os.path.join(download_folder, f"{original_title}(Audio).webm")
            subprocess.run(["ffmpeg", "-i", audio_path, "-c:a", "opus", converted_audio_path])
            os.remove(audio_path)
            audio_path = converted_audio_path

        if self.is_ffmpeg_available():
            subprocess.run(["ffmpeg", "-i", video_path, "-i", audio_path, "-c:v", "copy", "-c:a", "copy", final_output])
        else:
            from moviepy.editor import VideoFileClip, AudioFileClip, CompositeVideoClip
            video_clip = VideoFileClip(video_path)
            audio_clip = AudioFileClip(audio_path)
            final_clip = CompositeVideoClip([video_clip.set_audio(audio_clip)])
            final_clip.write_videofile(final_output, codec="libx264")

        directory, file_name = os.path.split(final_output)
        new_name = YoutubeScraper.safe_filename(f'{self.title}.{video_format}')
        restore_original_title_video = os.path.join(directory, new_name)
        os.rename(final_output, restore_original_title_video)
        final_output = restore_original_title_video
        self.final_output = final_output
        os.remove(video_path)
        os.remove(audio_path)

def is_valid_youtube_url(video_url):
    youtube_regex = (
        r'(https?://)?(www\.|m\.)?'
        r'(youtube\.com|youtu\.be|youtube-nocookie\.com)/'
        r'(watch\?v=|v/|u/\w/|embed/|/)?'
        r'(?P<video_id>[^#&?]*).*'
    )
    match = re.match(youtube_regex, video_url)
    return match is not None and len(match.group("video_id")) == 11

def create_app():
    app = Flask(__name__)
    CORS(app)

    @app.route('/', methods=["GET", "POST"])
    def index():
        return render_template('index.html')

    @app.route('/download_video', methods=['POST'])
    def download_video_route():
        video_url = request.form['video_url']
        video_quality = request.form['video_quality']
        video_format = request.form['video_format']
        audio_quality = request.form['audio_quality']
        try:
            scraper = YoutubeScraper(video_url)
            scraper.fetch_html()
            scraper.extract_metadata()
            scraper.download_video(video_quality, video_format, audio_quality)
            delete_file_after_delay(scraper.final_output, delay=300)
            download_url = f"{request.url_root}download_link/{os.path.basename(scraper.final_output)}"
            return jsonify({'message': 'Video Downloaded and Combined Successfully!', 'download_url': download_url})
        except Exception as e:
            return jsonify({'error': True, 'message': f'An error occurred: {e}'})

    @app.route('/download_link/<filename>', methods=['GET'])
    def download_link(filename):
        directory = Path.home() / "Downloads/Youtube_download"
        full_path = os.path.join(directory, filename)
        return send_file(full_path, as_attachment=True) if os.path.exists(full_path) else ("File not found", 404)

    @app.route('/delete_file', methods=['POST'])
    def delete_file_route():
        file_url = request.form['file_url']
        filename = os.path.basename(file_url);
        directory = str(Path.home() / "Downloads/Youtube_download");
        full_path = os.path.join(directory, filename);

        if not os.path.exists(full_path):
            return jsonify({'error': True, 'message': 'File not found or already deleted'})

        try:
            os.remove(full_path);
            return jsonify({'message': 'File deleted successfully!'});
        except Exception as e:
            return jsonify({'error': True, 'message': f'An error occurred: {e}'});

    @app.route('/get_video_info', methods=['POST'])
    def get_video_info():
        video_url = request.form['video_url']
        
        # if not video_url or not is_valid_youtube_url(video_url):
        #     return jsonify({'error': True, 'message': 'Enter a valid YouTube video URL!'})

        try:
            scraper = YoutubeScraper(video_url)
            scraper.fetch_html()
            scraper.extract_metadata()

            return jsonify({
                'title': scraper.title,
                'published_date': scraper.published_date,
                'channel_name': scraper.channel_name,
                'video_quality': ', '.join(scraper.video_qualities),
                'audio_quality': ', '.join(scraper.audio_qualities),
                'video_formats': ', '.join(scraper.video_formats),
                'video_url': video_url
            })
        except ValueError as ve:
            return jsonify({'error': True, 'message': str(ve)})
        # except Exception:
        #     return jsonify({'error': True, 'message': 'An error occurred while fetching video details.'})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': True, 'message': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': True, 'message': 'Internal server error'}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host='0.0.0.0', ssl_context=('cert.pem', 'key.pem'))

# ssl_context=('cert.pem', 'key.pem')