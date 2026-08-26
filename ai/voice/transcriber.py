import os

from dotenv import load_dotenv
from google import genai

load_dotenv()


class VoiceTranscriber:

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY not found."
            )

        self.client = genai.Client(api_key=api_key)

    def transcribe(self, audio_path: str) -> str:

        audio_file = self.client.files.upload(
            file=audio_path
        )

        interaction = self.client.interactions.create(
            model="gemini-3.6-flash",
            input=[
                {
                    "type": "text",
                    "text": """
Transcribe the speech in this audio accurately.

Supported languages:
- Hindi
- Marathi
- English

Requirements:
1. Detect the spoken language automatically.
2. Preserve the original language.
3. Do not translate.
4. Do not summarize.
5. Do not add information.
6. Return only the transcript.
"""
                },
                {
                    "type": "audio",
                    "uri": audio_file.uri,
                    "mime_type": audio_file.mime_type
                }
            ]
        )

        return interaction.output_text.strip()