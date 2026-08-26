from ai.voice.transcriber import VoiceTranscriber

AUDIO_FILE = "/Users/aayush/Desktop/artisan-voice-test/recording_20260826_080604.wav"

transcriber = VoiceTranscriber()

print("🎙 Transcribing...")
print()

transcript = transcriber.transcribe(AUDIO_FILE)

print("========== TRANSCRIPT ==========")
print(transcript)
