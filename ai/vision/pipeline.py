"""OpenCV Multi-Stage Image Enhancement Pipeline for Artisan E-Commerce Products.

Implements a sequence of controlled, professional computer vision corrections:
1. Alpha Mask Extraction & Bounding Box Detection
2. Intelligent Cropping with Safe Padding (10-12%)
3. Conservative Gray-World White-Balance Correction
4. Adaptive Exposure & Gamma Correction
5. Local Contrast Enhancement via CLAHE on LAB L-Channel
6. Mild Bilateral / Gaussian Noise Reduction
7. Unsharp Mask Detail & Texture Recovery
8. Adaptive Mild Color Saturation Normalization
9. 3D Soft Shadow Generation from Alpha Mask
10. Final 1080x1080 Studio Canvas Compositing
"""

import os
from typing import Tuple, Optional, Dict, Any
import cv2
import numpy as np


def extract_product_and_mask(image_bgra: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Split BGRA image into BGR product pixels and clean single-channel alpha mask."""
    if image_bgra.shape[2] == 4:
        bgr = image_bgra[:, :, :3]
        alpha = image_bgra[:, :, 3]
        # Clean faint ghost artifacts from background removal boundary
        _, alpha = cv2.threshold(alpha, 60, 255, cv2.THRESH_TOZERO)
    else:
        bgr = image_bgra
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        _, alpha = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY_INV)
    return bgr, alpha


def crop_with_padding(
    bgr: np.ndarray,
    alpha: np.ndarray,
    padding_ratio: float = 0.10,
    alpha_threshold: int = 80,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Find product bounding box from alpha mask (ignoring faint ghost artifacts)
    and crop with safe padding.
    """
    _, alpha_clean = cv2.threshold(alpha, alpha_threshold, 255, cv2.THRESH_BINARY)
    coords = cv2.findNonZero(alpha_clean)
    if coords is None:
        return bgr, alpha

    x, y, w, h = cv2.boundingRect(coords)
    img_h, img_w = bgr.shape[:2]

    pad_x = int(w * padding_ratio)
    pad_y = int(h * padding_ratio)

    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(img_w, x + w + pad_x)
    y2 = min(img_h, y + h + pad_y)

    return bgr[y1:y2, x1:x2], alpha[y1:y2, x1:x2]


def correct_white_balance_conservative(
    bgr: np.ndarray,
    alpha: np.ndarray,
    threshold: float = 15.0,
) -> np.ndarray:
    """
    Apply conservative Gray-World white balancing only if a noticeable color cast exists.
    """
    mask = alpha > 20
    if not np.any(mask):
        return bgr

    b_mean = np.mean(bgr[:, :, 0][mask])
    g_mean = np.mean(bgr[:, :, 1][mask])
    r_mean = np.mean(bgr[:, :, 2][mask])

    gray_mean = (b_mean + g_mean + r_mean) / 3.0
    cast_delta = max(abs(b_mean - gray_mean), abs(g_mean - gray_mean), abs(r_mean - gray_mean))

    if cast_delta < threshold:
        return bgr

    scale_factor = 0.5
    kb = 1.0 + scale_factor * ((gray_mean / (b_mean + 1e-5)) - 1.0)
    kg = 1.0 + scale_factor * ((gray_mean / (g_mean + 1e-5)) - 1.0)
    kr = 1.0 + scale_factor * ((gray_mean / (r_mean + 1e-5)) - 1.0)

    out = bgr.astype(np.float32)
    out[:, :, 0] = np.clip(out[:, :, 0] * kb, 0, 255)
    out[:, :, 1] = np.clip(out[:, :, 1] * kg, 0, 255)
    out[:, :, 2] = np.clip(out[:, :, 2] * kr, 0, 255)

    return out.astype(np.uint8)


def correct_exposure_adaptive(
    bgr: np.ndarray,
    alpha: np.ndarray,
    target_brightness: float = 135.0,
) -> np.ndarray:
    """
    Apply smooth Gamma correction based on product mean luminance.
    """
    mask = alpha > 20
    if not np.any(mask):
        return bgr

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    current_brightness = np.mean(gray[mask])

    if current_brightness < 115.0:
        gamma = max(1.1, min(1.4, target_brightness / (current_brightness + 1e-5)))
        inv_gamma = 1.0 / gamma
        lut = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")
        return cv2.LUT(bgr, lut)
    elif current_brightness > 195.0:
        gamma = 0.90
        inv_gamma = 1.0 / gamma
        lut = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")
        return cv2.LUT(bgr, lut)

    return bgr


def enhance_contrast_clahe_lab(
    bgr: np.ndarray,
    clip_limit: float = 2.0,
    tile_size: Tuple[int, int] = (8, 8),
) -> np.ndarray:
    """
    Apply CLAHE strictly to the Lightness (L) channel in LAB color space.
    """
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_size)
    l_enhanced = clahe.apply(l)

    lab_enhanced = cv2.merge((l_enhanced, a, b))
    return cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)


def reduce_noise_bilateral(
    bgr: np.ndarray,
    d: int = 5,
    sigma_color: float = 30.0,
    sigma_space: float = 30.0,
) -> np.ndarray:
    """
    Apply mild edge-preserving bilateral filtering to smooth high-ISO smartphone sensor grain.
    """
    return cv2.bilateralFilter(bgr, d=d, sigmaColor=sigma_color, sigmaSpace=sigma_space)


def sharpen_unsharp_mask(
    bgr: np.ndarray,
    kernel_size: Tuple[int, int] = (5, 5),
    sigma: float = 1.5,
    amount: float = 0.65,
) -> np.ndarray:
    """
    Recover lost perceived sharpness and fine craft details using controlled unsharp masking.
    """
    blurred = cv2.GaussianBlur(bgr, kernel_size, sigma)
    detail = cv2.subtract(bgr, blurred)
    sharpened = cv2.addWeighted(bgr, 1.0, detail, amount, 0)
    return np.clip(sharpened, 0, 255).astype(np.uint8)


def enhance_saturation_adaptive(
    bgr: np.ndarray,
    alpha: np.ndarray,
    boost_factor: float = 1.12,
) -> np.ndarray:
    """
    Adaptive mild saturation boost in HSV space for naturally vibrant handicrafts.
    """
    mask = alpha > 20
    if not np.any(mask):
        return bgr

    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, s, v = cv2.split(hsv)

    mean_s = np.mean(s[mask])
    if mean_s < 120:
        s = np.clip(s * boost_factor, 0, 255)

    hsv_enhanced = cv2.merge((h, s, v)).astype(np.uint8)
    return cv2.cvtColor(hsv_enhanced, cv2.COLOR_HSV2BGR)


def create_soft_shadow(
    alpha_mask: np.ndarray,
    target_shape: Tuple[int, int],
    offset_y: int = 18,
    blur_ksize: int = 35,
    opacity: float = 0.28,
) -> np.ndarray:
    """
    Derive a realistic 3D contact/floor shadow from the product's alpha mask.
    """
    h_out, w_out = target_shape[:2]
    shadow_layer = np.zeros((h_out, w_out), dtype=np.float32)

    h_mask, w_mask = alpha_mask.shape[:2]
    y1 = min(h_out, offset_y)
    y2 = min(h_out, offset_y + h_mask)
    x1 = (w_out - w_mask) // 2
    x2 = x1 + w_mask

    mask_h_slice = y2 - y1
    if mask_h_slice > 0 and x2 <= w_out and x1 >= 0:
        shadow_layer[y1:y2, x1:x2] = alpha_mask[:mask_h_slice, :] / 255.0

    k = blur_ksize if blur_ksize % 2 != 0 else blur_ksize + 1
    blurred_shadow = cv2.GaussianBlur(shadow_layer, (k, k), 0)

    return np.clip(blurred_shadow * opacity, 0.0, 1.0)


def composite_studio_canvas(
    product_bgr: np.ndarray,
    product_alpha: np.ndarray,
    canvas_size: Tuple[int, int] = (1080, 1080),
    background_bgr: Tuple[int, int, int] = (255, 255, 255),
    add_shadow: bool = True,
) -> np.ndarray:
    """
    Scale product proportionally to fit inside canvas with 12% padding,
    generate soft shadow, and composite on clean background.
    """
    c_w, c_h = canvas_size
    p_h, p_w = product_bgr.shape[:2]

    max_w = int(c_w * 0.82)
    max_h = int(c_h * 0.82)

    scale = min(max_w / p_w, max_h / p_h)
    new_w = max(1, int(p_w * scale))
    new_h = max(1, int(p_h * scale))

    resized_bgr = cv2.resize(product_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)
    resized_alpha = cv2.resize(product_alpha, (new_w, new_h), interpolation=cv2.INTER_AREA)

    canvas = np.full((c_h, c_w, 3), background_bgr, dtype=np.float32)

    if add_shadow:
        shadow_mask = create_soft_shadow(resized_alpha, (c_h, c_w), offset_y=int(new_h * 0.05) + (c_h - new_h) // 2)
        shadow_color = np.array([30, 30, 30], dtype=np.float32)
        for c in range(3):
            canvas[:, :, c] = canvas[:, :, c] * (1.0 - shadow_mask) + shadow_color[c] * shadow_mask

    top = (c_h - new_h) // 2
    left = (c_w - new_w) // 2
    bottom = top + new_h
    right = left + new_w

    alpha_norm = (resized_alpha / 255.0)[:, :, np.newaxis]
    canvas[top:bottom, left:right] = (
        alpha_norm * resized_bgr.astype(np.float32) + (1.0 - alpha_norm) * canvas[top:bottom, left:right]
    )

    return np.clip(canvas, 0, 255).astype(np.uint8)


def process_artisan_image(
    input_image_bgra: np.ndarray,
    canvas_size: Tuple[int, int] = (1080, 1080),
    background_color: str = "white",
    add_shadow: bool = True,
) -> Dict[str, Any]:
    """
    Execute full 14-stage OpenCV enhancement and compositing pipeline.
    """
    bgr, alpha = extract_product_and_mask(input_image_bgra)
    bgr_cropped, alpha_cropped = crop_with_padding(bgr, alpha, padding_ratio=0.10)
    bgr_wb = correct_white_balance_conservative(bgr_cropped, alpha_cropped)
    bgr_exp = correct_exposure_adaptive(bgr_wb, alpha_cropped)
    bgr_clahe = enhance_contrast_clahe_lab(bgr_exp)
    bgr_denoised = reduce_noise_bilateral(bgr_clahe)
    bgr_sharp = sharpen_unsharp_mask(bgr_denoised)
    bgr_final = enhance_saturation_adaptive(bgr_sharp, alpha_cropped)

    bg_bgr = (255, 255, 255)
    if background_color == "warm_neutral":
        bg_bgr = (238, 244, 247)
    elif background_color == "minimal_grey":
        bg_bgr = (247, 245, 245)
    elif background_color == "terracotta_sand":
        bg_bgr = (225, 235, 244)

    final_canvas = composite_studio_canvas(
        product_bgr=bgr_final,
        product_alpha=alpha_cropped,
        canvas_size=canvas_size,
        background_bgr=bg_bgr,
        add_shadow=add_shadow,
    )

    return {
        "enhanced_image": final_canvas,
        "product_bgr": bgr_final,
        "alpha_mask": alpha_cropped,
    }
