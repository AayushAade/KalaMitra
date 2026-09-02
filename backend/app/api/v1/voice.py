"""Voice Cataloging API router module."""

import logging
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from backend.app.schemas.voice import VoiceTranscribeResponse
from backend.app.services.voice_service import voice_service

logger = logging.getLogger("kalamitra.api.voice")

router = APIRouter()


@router.post(
    "/transcribe-and-extract",
    response_model=VoiceTranscribeResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe vernacular artisan speech and extract structured product catalog metadata",
    description="Accepts an audio recording (WAV, M4A, MP3, AAC, WebM) from the artisan, transcribes verbatim speech, and generates structured multilingual catalog listings using Gemini.",
)
async def transcribe_and_extract(
    audio: Optional[UploadFile] = File(None, description="Uploaded audio recording file (multipart)"),
    file: Optional[UploadFile] = File(None, description="Alternative field name for audio file"),
    language_hint: Optional[str] = Form(None, description="Optional vernacular language hint (e.g. Hindi, Marathi, English)"),
) -> VoiceTranscribeResponse:
    """Handle speech-to-text transcription and structured product extraction."""
    target_file = audio or file

    if not target_file:
        logger.warning("[VoiceAPI] No audio file part provided in request.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audio file provided. Please attach an audio file using field name 'audio' or 'file'.",
        )

    # Read binary bytes from upload
    try:
        content = await target_file.read()
    except Exception as e:
        logger.error(f"[VoiceAPI] Failed to read audio stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded audio stream: {str(e)}",
        )

    if not content or len(content) == 0:
        logger.warning("[VoiceAPI] Uploaded audio file is empty (0 bytes).")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded audio file is empty (0 bytes). Please record a valid audio sample.",
        )

    filename = target_file.filename or "recording.wav"
    logger.info(f"[VoiceAPI] Received audio file '{filename}' ({len(content)} bytes), hint: {language_hint}")

    # Process through VoiceService
    try:
        result = voice_service.process_audio(audio_bytes=content, filename=filename)
        return result
    except ValueError as ve:
        logger.warning(f"[VoiceAPI] Validation error: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except RuntimeError as re:
        logger.error(f"[VoiceAPI] Runtime error during voice processing: {re}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(re),
        )
    except Exception as exc:
        logger.exception(f"[VoiceAPI] Unexpected internal error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during speech analysis: {str(exc)}",
        )
