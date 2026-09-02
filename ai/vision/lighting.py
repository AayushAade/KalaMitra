"""AI Lighting Correction & White-Balance Engine for Artisan Photographs.

Restores natural indoor lighting, lifts underexposed shadows, eliminates harsh yellow/green
tungsten bulb casts, and sharpens micro-contrast on handicrafts (pottery, textiles, wood, jewellery)
WITHOUT shifting genuine craft dyes, material textures, or handmade characteristics.
"""

import io
from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, Optional, Tuple, Union

import cv2
import numpy as np
from PIL import Image


class LightingCorrector:
    """Intelligent lighting and exposure balance engine for craft photos."""

    def __init__(
        self,
        clahe_clip_limit: float = 2.0,
        tile_grid_size: Tuple[int, int] = (8, 8),
    ) -> None:
        """Initialize LightingCorrector with CLAHE parameters."""
        self.clahe_clip_limit = clahe_clip_limit
        self.tile_grid_size = tile_grid_size
        self._clahe = cv2.createCLAHE(
            clipLimit=self.clahe_clip_limit,
            tileGridSize=self.tile_grid_size,
        )

    def _to_cv2(self, image_input: Union[str, Path, bytes, BinaryIO, Image.Image, np.ndarray]) -> np.ndarray:
        """Convert any image input type to BGR OpenCV numpy array."""
        if isinstance(image_input, np.ndarray):
            if len(image_input.shape) == 2:
                return cv2.cvtColor(image_input, cv2.COLOR_GRAY2BGR)
            elif image_input.shape[2] == 4:
                return cv2.cvtColor(image_input, cv2.COLOR_BGRA2BGR)
            return image_input.copy()

        if isinstance(image_input, Image.Image):
            rgb = image_input.convert("RGB")
            return cv2.cvtColor(np.array(rgb), cv2.COLOR_RGB2BGR)

        image_bytes: bytes
        if isinstance(image_input, (str, Path)):
            path = Path(image_input)
            if not path.exists():
                raise FileNotFoundError(f"Image file not found: {path}")
            image_bytes = path.read_bytes()
        elif isinstance(image_input, bytes):
            image_bytes = image_input
        elif hasattr(image_input, "read"):
            image_bytes = image_input.read()
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image buffer into OpenCV matrix")
        return img

    def auto_white_balance(self, bgr_img: np.ndarray) -> np.ndarray:
        """Correct color temperature casts using the Gray-World / Percentile algorithm."""
        result = bgr_img.astype(np.float32)
        # Compute 98th percentile for each channel to avoid outlier specular highlights
        b_p = np.percentile(result[:, :, 0], 98)
        g_p = np.percentile(result[:, :, 1], 98)
        r_p = np.percentile(result[:, :, 2], 98)

        # Target gray reference
        avg_gray = (b_p + g_p + r_p) / 3.0
        if avg_gray < 1.0:
            return bgr_img

        scale_b = avg_gray / (b_p + 1e-5)
        scale_g = avg_gray / (g_p + 1e-5)
        scale_r = avg_gray / (r_p + 1e-5)

        # Bound scaling factors to prevent overcorrection
        scale_b = np.clip(scale_b, 0.75, 1.35)
        scale_g = np.clip(scale_g, 0.75, 1.35)
        scale_r = np.clip(scale_r, 0.75, 1.35)

        result[:, :, 0] *= scale_b
        result[:, :, 1] *= scale_g
        result[:, :, 2] *= scale_r

        return np.clip(result, 0, 255).astype(np.uint8)

    def adaptive_contrast_enhancement(self, bgr_img: np.ndarray) -> np.ndarray:
        """Apply CLAHE on CIELAB L-channel to brighten shadows without color distortion."""
        lab = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        # Apply CLAHE only to Lightness channel
        enhanced_l = self._clahe.apply(l_channel)

        # Merge back
        enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
        return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    def auto_gamma_exposure(self, bgr_img: np.ndarray) -> np.ndarray:
        """Dynamically adjust gamma if the photograph is underexposed."""
        gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
        mean_lum = np.mean(gray)

        # If underexposed (mean luminance < 110), compute optimal gamma lift
        if mean_lum < 110:
            gamma = np.clip(110.0 / (mean_lum + 1e-5), 1.0, 1.6)
            inv_gamma = 1.0 / gamma
            table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype(np.uint8)
            return cv2.LUT(bgr_img, table)
        return bgr_img

    def correct_lighting(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image, np.ndarray],
        enable_white_balance: bool = True,
        enable_clahe: bool = True,
        enable_auto_exposure: bool = True,
        output_format: str = "JPG",
    ) -> Tuple[bytes, Dict[str, Any]]:
        """Execute the complete lighting and exposure enhancement sequence.

        Args:
            image_input: Source image input.
            enable_white_balance: Whether to apply color temperature normalization.
            enable_clahe: Whether to apply adaptive shadow/contrast correction.
            enable_auto_exposure: Whether to lift underexposure.
            output_format: Output image format ('JPG' or 'PNG').

        Returns:
            Tuple of (enhanced_image_bytes, telemetry_metadata).
        """
        start_time = time.time()
        bgr = self._to_cv2(image_input)
        orig_mean_lum = float(np.mean(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)))

        working = bgr
        if enable_white_balance:
            working = self.auto_white_balance(working)

        if enable_auto_exposure:
            working = self.auto_gamma_exposure(working)

        if enable_clahe:
            working = self.adaptive_contrast_enhancement(working)

        new_mean_lum = float(np.mean(cv2.cvtColor(working, cv2.COLOR_BGR2GRAY)))
        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        # Encode output bytes
        ext = ".jpg" if output_format.upper() in ("JPG", "JPEG") else ".png"
        params = [int(cv2.IMWRITE_JPEG_QUALITY), 95] if ext == ".jpg" else [int(cv2.IMWRITE_PNG_COMPRESSION), 4]
        success, encoded = cv2.imencode(ext, working, params)
        if not success:
            raise RuntimeError("Failed to encode processed image to output buffer")

        telemetry = {
            "execution_time_ms": elapsed_ms,
            "original_luminance": round(orig_mean_lum, 2),
            "enhanced_luminance": round(new_mean_lum, 2),
            "luminance_boost_percent": round(((new_mean_lum - orig_mean_lum) / (orig_mean_lum + 1e-5)) * 100, 2),
            "white_balance_applied": enable_white_balance,
            "clahe_applied": enable_clahe,
            "exposure_lift_applied": enable_auto_exposure,
        }

        return encoded.tobytes(), telemetry
