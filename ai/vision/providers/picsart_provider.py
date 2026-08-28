"""Picsart AI provider for background removal, super-resolution, and image quality enhancement.

Handles isolated communication with Picsart REST APIs using server-side credentials.
Provides cutout generation, ultra-enhancement, upscaling, and exposure/clarity adjustments
WITHOUT altering underlying product geometry or authentic craft textures.
"""

import io
import json
import mimetypes
import os
from pathlib import Path
import socket
import time
from typing import Any, BinaryIO, Dict, Optional, Tuple, Union
import urllib.error
import urllib.parse
import urllib.request
import uuid

from ai.vision.config import PicsartSettings, get_picsart_config
from ai.vision.schemas import ProcessedImageResult


class PicsartProvider:
    """Server-side provider client for Picsart Creative APIs."""

    def __init__(self, settings: Optional[PicsartSettings] = None) -> None:
        """Initialize provider with configuration.

        Args:
            settings: Optional PicsartSettings. If None, loaded from environment.
        """
        self._settings = settings

    @property
    def settings(self) -> PicsartSettings:
        """Lazy-load settings on demand."""
        if self._settings is None:
            self._settings = get_picsart_config()
        return self._settings

    def _encode_multipart_formdata(
        self,
        fields: Dict[str, str],
        files: Dict[str, Tuple[str, bytes, str]],
    ) -> Tuple[bytes, str]:
        """Encode form fields and files into a standard multipart/form-data payload.

        Args:
            fields: Key-value form parameters.
            files: Dictionary of field_name -> (filename, file_bytes, content_type).

        Returns:
            Tuple of (body_bytes, content_type_header_value).
        """
        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        body = io.BytesIO()

        # Write text fields
        for key, value in fields.items():
            body.write(f"--{boundary}\r\n".encode("utf-8"))
            body.write(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"))
            body.write(f"{value}\r\n".encode("utf-8"))

        # Write file fields
        for field_name, (filename, file_bytes, content_type) in files.items():
            body.write(f"--{boundary}\r\n".encode("utf-8"))
            body.write(
                f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode("utf-8")
            )
            body.write(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
            body.write(file_bytes)
            body.write(b"\r\n")

        body.write(f"--{boundary}--\r\n".encode("utf-8"))
        content_type_header = f"multipart/form-data; boundary={boundary}"
        return body.getvalue(), content_type_header

    def _prepare_payload(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        operation_name: str,
    ) -> Tuple[Optional[Dict[str, str]], Optional[Dict[str, Tuple[str, bytes, str]]], Optional[ProcessedImageResult]]:
        """Validate input and prepare multipart fields/files dictionaries."""
        fields: Dict[str, str] = {}
        files: Dict[str, Tuple[str, bytes, str]] = {}

        if isinstance(image_input, str) and (
            image_input.startswith("http://") or image_input.startswith("https://")
        ):
            fields["image_url"] = image_input
        elif isinstance(image_input, (str, Path)):
            file_path = Path(image_input)
            if not file_path.exists():
                return None, None, ProcessedImageResult(
                    success=False,
                    provider="picsart",
                    operation=operation_name,
                    error=f"Source image file not found: {file_path}",
                    error_code="FILE_NOT_FOUND",
                )
            file_bytes = file_path.read_bytes()
            if not file_bytes:
                return None, None, ProcessedImageResult(
                    success=False,
                    provider="picsart",
                    operation=operation_name,
                    error="Uploaded image file is empty (0 bytes)",
                    error_code="EMPTY_IMAGE",
                )
            mime_type, _ = mimetypes.guess_type(str(file_path))
            files["image"] = (file_path.name, file_bytes, mime_type or "image/jpeg")
        elif isinstance(image_input, bytes):
            if not image_input:
                return None, None, ProcessedImageResult(
                    success=False,
                    provider="picsart",
                    operation=operation_name,
                    error="Image byte buffer is empty (0 bytes)",
                    error_code="EMPTY_IMAGE",
                )
            files["image"] = ("upload.jpg", image_input, "image/jpeg")
        elif hasattr(image_input, "read"):
            data = image_input.read()
            if not data:
                return None, None, ProcessedImageResult(
                    success=False,
                    provider="picsart",
                    operation=operation_name,
                    error="Image stream is empty (0 bytes)",
                    error_code="EMPTY_IMAGE",
                )
            filename = getattr(image_input, "name", "upload.jpg")
            if isinstance(filename, (str, Path)):
                filename = Path(filename).name
            else:
                filename = "upload.jpg"
            files["image"] = (filename, data, "image/jpeg")
        else:
            return None, None, ProcessedImageResult(
                success=False,
                provider="picsart",
                operation=operation_name,
                error=f"Unsupported image input type: {type(image_input)}",
                error_code="INVALID_INPUT_TYPE",
            )

        return fields, files, None

    def _execute_request(
        self,
        endpoint_path: str,
        operation_name: str,
        extra_fields: Dict[str, str],
        image_input: Union[str, Path, bytes, BinaryIO],
        output_format: str = "PNG",
    ) -> ProcessedImageResult:
        """Execute a request against a Picsart endpoint with standardized error and timeout handling."""
        try:
            settings = self.settings
        except Exception as exc:
            return ProcessedImageResult(
                success=False,
                provider="picsart",
                operation=operation_name,
                error=f"Configuration error: {str(exc)}",
                error_code="MISSING_API_KEY",
            )

        fields, files, err_result = self._prepare_payload(image_input, operation_name)
        if err_result is not None:
            return err_result

        assert fields is not None and files is not None
        fields.update(extra_fields)
        fields["format"] = output_format.upper()

        endpoint_url = f"{settings.base_url.rstrip('/')}{endpoint_path}"
        start_time = time.time()

        payload_bytes, content_type_header = self._encode_multipart_formdata(fields, files)

        req = urllib.request.Request(
            url=endpoint_url,
            data=payload_bytes,
            headers={
                "X-Picsart-API-Key": settings.api_key,
                "Content-Type": content_type_header,
                "Accept": "application/json",
                "User-Agent": "KalaMitra-VisionEngine/1.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=settings.timeout_seconds) as response:
                status_code = response.status
                response_body = response.read().decode("utf-8")

            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            parsed = json.loads(response_body)

            data_block = parsed.get("data", {})
            output_url = data_block.get("url") or parsed.get("url")

            if not output_url:
                return ProcessedImageResult(
                    success=False,
                    provider="picsart",
                    operation=operation_name,
                    error="Picsart returned success status but missing output URL in payload",
                    error_code="MALFORMED_RESPONSE",
                    metadata={
                        "raw_response": parsed,
                        "status_code": status_code,
                        "execution_time_ms": elapsed_ms,
                    },
                )

            return ProcessedImageResult(
                success=True,
                provider="picsart",
                operation=operation_name,
                output_url=output_url,
                output_format=output_format.upper(),
                metadata={
                    "asset_id": data_block.get("id"),
                    "status_code": status_code,
                    "execution_time_ms": elapsed_ms,
                    "provider_status": parsed.get("status") or data_block.get("status"),
                },
            )

        except urllib.error.HTTPError as http_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            code = http_err.code
            try:
                err_body = http_err.read().decode("utf-8")
                err_json = json.loads(err_body)
                error_msg = (
                    err_json.get("message")
                    or err_json.get("detail")
                    or err_json.get("error")
                    or str(err_json)
                )
            except Exception:
                error_msg = f"HTTP {code}: {http_err.reason}"

            if code in (401, 403):
                error_code = "UNAUTHORIZED"
                error_desc = "Picsart authentication failed. Check PICSART_API_KEY."
            elif code == 429:
                error_code = "RATE_LIMITED"
                error_desc = "Picsart rate limit or credit quota exceeded."
            elif code == 400:
                error_code = "BAD_REQUEST"
                error_desc = f"Picsart rejected request parameters: {error_msg}"
            elif code >= 500:
                error_code = "SERVER_ERROR"
                error_desc = f"Picsart server error (HTTP {code}): {error_msg}"
            else:
                error_code = f"HTTP_{code}"
                error_desc = f"Picsart API error (HTTP {code}): {error_msg}"

            return ProcessedImageResult(
                success=False,
                provider="picsart",
                operation=operation_name,
                error=error_desc,
                error_code=error_code,
                metadata={"status_code": code, "execution_time_ms": elapsed_ms},
            )

        except (urllib.error.URLError, socket.timeout, TimeoutError) as net_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            if isinstance(net_err, (socket.timeout, TimeoutError)) or "timed out" in str(net_err).lower():
                return ProcessedImageResult(
                    success=False,
                    provider="picsart",
                    operation=operation_name,
                    error=f"Picsart request timed out after {settings.timeout_seconds} seconds",
                    error_code="TIMEOUT",
                    metadata={"execution_time_ms": elapsed_ms},
                )
            return ProcessedImageResult(
                success=False,
                provider="picsart",
                operation=operation_name,
                error=f"Network connection failure to Picsart API: {str(net_err.reason if hasattr(net_err, 'reason') else net_err)}",
                error_code="CONNECTION_ERROR",
                metadata={"execution_time_ms": elapsed_ms},
            )

        except json.JSONDecodeError as json_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return ProcessedImageResult(
                success=False,
                provider="picsart",
                operation=operation_name,
                error=f"Malformed JSON response from Picsart API: {str(json_err)}",
                error_code="MALFORMED_RESPONSE",
                metadata={"execution_time_ms": elapsed_ms},
            )

        except Exception as exc:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return ProcessedImageResult(
                success=False,
                provider="picsart",
                operation=operation_name,
                error=f"Unexpected error during Picsart processing: {str(exc)}",
                error_code="UNEXPECTED_ERROR",
                metadata={"execution_time_ms": elapsed_ms},
            )

    def remove_background(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        output_format: str = "PNG",
    ) -> ProcessedImageResult:
        """Remove background and isolate the artisan product cutout.

        Args:
            image_input: File path, URL (starts with http/https), raw bytes, or file stream.
            output_format: Desired output format (default "PNG" for transparent cutouts).

        Returns:
            ProcessedImageResult with output URL and metadata.
        """
        return self._execute_request(
            endpoint_path="/removebg",
            operation_name="remove_background",
            extra_fields={"output_type": "cutout"},
            image_input=image_input,
            output_format=output_format,
        )

    def upscale(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        upscale_factor: int = 2,
        output_format: str = "JPG",
    ) -> ProcessedImageResult:
        """Upscale image resolution with super-resolution detail recovery.

        Args:
            image_input: Source image input.
            upscale_factor: Scaling multiplier (2 or 4).
            output_format: Desired output format ('JPG' or 'PNG').

        Returns:
            ProcessedImageResult with upscaled asset URL and metadata.
        """
        factor = 2 if upscale_factor not in (2, 4) else upscale_factor
        return self._execute_request(
            endpoint_path="/upscale",
            operation_name="upscale",
            extra_fields={"upscale_factor": str(factor)},
            image_input=image_input,
            output_format=output_format,
        )

    def ultra_enhance(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        upscale_factor: int = 2,
        output_format: str = "JPG",
    ) -> ProcessedImageResult:
        """Execute deep AI ultra-enhancement (super-resolution + denoising + sharpening).

        Endpoint: POST https://api.picsart.io/tools/1.0/upscale/enhance

        Args:
            image_input: Source image input.
            upscale_factor: Scaling multiplier (2 or 4).
            output_format: Desired output format ('JPG' or 'PNG').

        Returns:
            ProcessedImageResult with ultra-enhanced asset URL and metadata.
        """
        factor = 2 if upscale_factor not in (2, 4) else upscale_factor
        return self._execute_request(
            endpoint_path="/upscale/enhance",
            operation_name="ultra_enhance",
            extra_fields={"upscale_factor": str(factor)},
            image_input=image_input,
            output_format=output_format,
        )

    def adjust(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        brightness: int = 0,
        contrast: int = 0,
        clarity: int = 0,
        saturation: int = 0,
        vibrance: int = 0,
        output_format: str = "JPG",
    ) -> ProcessedImageResult:
        """Adjust image lighting, clarity, contrast, and color vibrancy.

        Args:
            image_input: Source image input.
            brightness: Brightness adjustment (-100 to 100).
            contrast: Contrast adjustment (-100 to 100).
            clarity: Clarity enhancement (0 to 100).
            saturation: Saturation adjustment (-100 to 100).
            vibrance: Vibrance adjustment (-100 to 100).
            output_format: Desired output format ('JPG' or 'PNG').

        Returns:
            ProcessedImageResult with adjusted asset URL and metadata.
        """
        fields = {
            "brightness": str(max(-100, min(100, brightness))),
            "contrast": str(max(-100, min(100, contrast))),
            "clarity": str(max(0, min(100, clarity))),
            "saturation": str(max(-100, min(100, saturation))),
            "vibrance": str(max(-100, min(100, vibrance))),
        }
        return self._execute_request(
            endpoint_path="/adjust",
            operation_name="adjust",
            extra_fields=fields,
            image_input=image_input,
            output_format=output_format,
        )
