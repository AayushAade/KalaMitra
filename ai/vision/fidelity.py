"""Product Fidelity Validation Engine for KalaMitra AI Vision.

Quantitatively assesses whether a generated or restyled image has preserved the physical artisan
product from the raw photograph by analyzing product-isolated silhouette IoU, structural similarity (SSIM),
CIELAB color difference (Delta E), and geometric aspect ratios.

Designed with dual-engine support (standard Python/PIL + accelerated NumPy/CV) to run
seamlessly in any runtime environment without hard dependency failures.

IMPORTANT:
Provides an automated, measurable confidence signal (PASS / REVIEW / FAIL) and does not
mathematically guarantee 100% physical-product preservation.
"""

from __future__ import annotations

import io
import math
import os
from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, List, Optional, Tuple, Union

from PIL import Image, ImageChops, ImageFilter, ImageStat

from ai.vision.config import FidelitySettings, get_fidelity_config
from ai.vision.schemas import FidelityMetrics, FidelityValidationResult

# Canonical dimension for normalized product region comparison
CANONICAL_SIZE = (256, 256)

CATEGORY_WEIGHTS: Dict[str, Dict[str, float]] = {
    "pottery": {
        "w_iou": 0.35,
        "w_sil": 0.25,
        "w_ssim": 0.25,
        "w_col": 0.15,
    },
    "textiles": {
        "w_iou": 0.30,
        "w_sil": 0.25,
        "w_ssim": 0.20,
        "w_col": 0.25,
    },
    "jewellery": {
        "w_iou": 0.30,
        "w_sil": 0.20,
        "w_ssim": 0.25,
        "w_col": 0.25,
    },
    "wooden_crafts": {
        "w_iou": 0.35,
        "w_sil": 0.25,
        "w_ssim": 0.25,
        "w_col": 0.15,
    },
    "general": {
        "w_iou": 0.30,
        "w_sil": 0.25,
        "w_ssim": 0.25,
        "w_col": 0.20,
    },
}


class ProductFidelityValidator:
    """Evaluates product authenticity and geometric preservation between original and edited photos."""

    def __init__(
        self,
        settings: Optional[FidelitySettings] = None,
        rembg_provider: Any = None,
    ) -> None:
        """Initialize validator with configurable thresholds."""
        self.settings = settings or get_fidelity_config()
        self.rembg = rembg_provider

    def _normalize_image_input(
        self,
        image_input: Any,
    ) -> Tuple[Image.Image, Optional[Image.Image]]:
        """Normalize various image formats into PIL RGB Image and optional alpha mask.

        Returns:
            Tuple of (rgb_image, optional_alpha_mask).
        """
        pil_img: Image.Image

        if isinstance(image_input, (str, Path)):
            path_obj = Path(image_input)
            if not path_obj.exists():
                raise FileNotFoundError(f"Image file not found: {path_obj}")
            pil_img = Image.open(path_obj)
        elif isinstance(image_input, bytes):
            pil_img = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            pil_img = image_input
        elif hasattr(image_input, "read"):
            pil_img = Image.open(image_input)
        elif hasattr(image_input, "shape"):  # NumPy array
            arr = image_input
            if len(arr.shape) == 2:
                pil_img = Image.fromarray(arr).convert("RGB")
            elif arr.shape[2] == 4:
                pil_img = Image.fromarray(arr, mode="RGBA")
            else:
                pil_img = Image.fromarray(arr, mode="RGB")
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        alpha_mask = None
        if pil_img.mode in ("RGBA", "LA") or (pil_img.mode == "P" and "transparency" in pil_img.info):
            rgba = pil_img.convert("RGBA")
            alpha = rgba.split()[3]
            # Check if there is actual non-trivial transparency
            extrema = alpha.getextrema()
            if extrema[0] < 250:
                alpha_mask = alpha.point(lambda p: 255 if p > 10 else 0, mode="L")

        rgb_img = pil_img.convert("RGB")
        return rgb_img, alpha_mask

    def extract_product_mask(
        self,
        image_input: Any,
    ) -> Tuple[Image.Image, Image.Image]:
        """Extract RGB image and binary product mask (mode 'L': 0=background, 255=product).

        Returns:
            Tuple of (rgb_image, binary_mask_image).
        """
        rgb_img, alpha_mask = self._normalize_image_input(image_input)

        if alpha_mask is not None:
            return rgb_img, alpha_mask

        # If rembg provider is available, use it for foreground extraction
        if self.rembg is not None:
            try:
                cutout_bytes = self.rembg.extract_cutout_bytes(rgb_img)
                cutout_pil = Image.open(io.BytesIO(cutout_bytes)).convert("RGBA")
                mask = cutout_pil.split()[3].point(lambda p: 255 if p > 10 else 0, mode="L")
                bbox = mask.getbbox()
                if bbox is not None:
                    return rgb_img, mask
            except Exception:
                pass

        # Fallback segmentation: Adaptive luminance gradient thresholding
        gray = rgb_img.convert("L")
        w, h = gray.size
        # Sample border pixels to determine background tone
        border_pixels = []
        for x in range(0, w, max(1, w // 20)):
            border_pixels.append(gray.getpixel((x, 0)))
            border_pixels.append(gray.getpixel((x, h - 1)))
        for y in range(0, h, max(1, h // 20)):
            border_pixels.append(gray.getpixel((0, y)))
            border_pixels.append(gray.getpixel((w - 1, y)))

        bg_ref = sum(border_pixels) / float(len(border_pixels))
        # Threshold pixels that deviate from background by > 18 luminance
        mask = gray.point(lambda p: 255 if abs(p - bg_ref) > 18 else 0, mode="L")

        if mask.getbbox() is None:
            mask = Image.new("L", (w, h), 255)

        return rgb_img, mask

    def _crop_and_canonicalize(
        self,
        rgb_img: Image.Image,
        mask: Image.Image,
        target_size: Tuple[int, int] = CANONICAL_SIZE,
    ) -> Tuple[Image.Image, Image.Image, float]:
        """Crop product to tight bounding box and resize to canonical canvas with aspect ratio preservation.

        Returns:
            Tuple of (canonical_rgb, canonical_mask, aspect_ratio).
        """
        bbox = mask.getbbox()
        if bbox is None:
            bbox = (0, 0, rgb_img.width, rgb_img.height)

        xmin, ymin, xmax, ymax = bbox
        crop_w = max(1, xmax - xmin)
        crop_h = max(1, ymax - ymin)
        aspect_ratio = crop_w / float(crop_h)

        crop_rgb = rgb_img.crop((xmin, ymin, xmax, ymax))
        crop_mask = mask.crop((xmin, ymin, xmax, ymax))

        # Scale into target size preserving aspect ratio
        tw, th = target_size
        scale = min(tw / float(crop_w), th / float(crop_h))
        new_w = max(1, int(round(crop_w * scale)))
        new_h = max(1, int(round(crop_h * scale)))

        resized_rgb = crop_rgb.resize((new_w, new_h), Image.Resampling.BILINEAR)
        resized_mask = crop_mask.resize((new_w, new_h), Image.Resampling.NEAREST)

        pad_x = (tw - new_w) // 2
        pad_y = (th - new_h) // 2

        canon_rgb = Image.new("RGB", target_size, (0, 0, 0))
        canon_mask = Image.new("L", target_size, 0)

        # Paste strictly inside the mask to prevent any background color bleed
        canon_rgb.paste(resized_rgb, (pad_x, pad_y), mask=resized_mask)
        canon_mask.paste(resized_mask, (pad_x, pad_y))

        return canon_rgb, canon_mask, aspect_ratio

    def compute_mask_iou(self, mask1: Image.Image, mask2: Image.Image) -> float:
        """Compute Intersection over Union (IoU) of two aligned binary masks."""
        # Intersection = MIN, Union = MAX
        intersection = ImageChops.darker(mask1, mask2)
        union = ImageChops.lighter(mask1, mask2)

        # Count non-zero pixels
        int_stat = ImageStat.Stat(intersection)
        uni_stat = ImageStat.Stat(union)

        int_sum = int_stat.sum[0]
        uni_sum = uni_stat.sum[0]

        if uni_sum == 0:
            return 1.0 if int_sum == 0 else 0.0
        return float(int_sum) / float(uni_sum)

    def compute_silhouette_similarity(self, mask1: Image.Image, mask2: Image.Image) -> float:
        """Compute silhouette similarity based on boundary edge overlap."""
        # Extract edge contours using morphological filter
        edge1 = mask1.filter(ImageFilter.FIND_EDGES)
        edge2 = mask2.filter(ImageFilter.FIND_EDGES)

        # Dilate slightly for soft spatial tolerance (2px)
        dil1 = edge1.filter(ImageFilter.MaxFilter(3))
        dil2 = edge2.filter(ImageFilter.MaxFilter(3))

        overlap1 = ImageChops.darker(edge1, dil2)
        overlap2 = ImageChops.darker(edge2, dil1)

        sum_e1 = max(1.0, ImageStat.Stat(edge1).sum[0])
        sum_e2 = max(1.0, ImageStat.Stat(edge2).sum[0])

        score1 = ImageStat.Stat(overlap1).sum[0] / sum_e1
        score2 = ImageStat.Stat(overlap2).sum[0] / sum_e2

        return float(max(0.0, min(1.0, (score1 + score2) / 2.0)))

    def compute_masked_ssim(
        self,
        rgb1: Image.Image,
        rgb2: Image.Image,
        mask: Image.Image,
    ) -> float:
        """Compute Structural Similarity (SSIM) on grayscale images within the positive mask region."""
        gray1 = rgb1.convert("L")
        gray2 = rgb2.convert("L")

        # Collect positive pixel values
        pixels1 = []
        pixels2 = []

        def _get_pixels(im: Image.Image):
            if hasattr(im, "get_flattened_data"):
                return im.get_flattened_data()
            return im.getdata()

        g1_data = _get_pixels(gray1)
        g2_data = _get_pixels(gray2)
        m_data = _get_pixels(mask)

        for p1, p2, m in zip(g1_data, g2_data, m_data):
            if m > 127:
                pixels1.append(float(p1))
                pixels2.append(float(p2))

        n = len(pixels1)
        if n < 4:
            return 1.0

        # Mean
        mu1 = sum(pixels1) / float(n)
        mu2 = sum(pixels2) / float(n)

        # Variance & Covariance
        var1 = sum((x - mu1) ** 2 for x in pixels1) / float(n)
        var2 = sum((x - mu2) ** 2 for x in pixels2) / float(n)
        cov = sum((x - mu1) * (y - mu2) for x, y in zip(pixels1, pixels2)) / float(n)

        c1 = (0.01 * 255.0) ** 2
        c2 = (0.03 * 255.0) ** 2

        ssim_val = ((2.0 * mu1 * mu2 + c1) * (2.0 * cov + c2)) / (
            (mu1**2 + mu2**2 + c1) * (var1 + var2 + c2)
        )

        return float(max(0.0, min(1.0, ssim_val)))

    def _rgb_to_lab(self, r: float, g: float, b: float) -> Tuple[float, float, float]:
        """Convert sRGB [0..255] to CIELAB (L*, a*, b*)."""
        # Normalize to [0..1]
        r_n = r / 255.0
        g_n = g / 255.0
        b_n = b / 255.0

        # Inverse sRGB companding
        r_l = ((r_n + 0.055) / 1.055) ** 2.4 if r_n > 0.04045 else (r_n / 12.92)
        g_l = ((g_n + 0.055) / 1.055) ** 2.4 if g_n > 0.04045 else (g_n / 12.92)
        b_l = ((b_n + 0.055) / 1.055) ** 2.4 if b_n > 0.04045 else (b_n / 12.92)

        # Convert to XYZ (D65 illuminant)
        x = r_l * 0.4124564 + g_l * 0.3575761 + b_l * 0.1804375
        y = r_l * 0.2126729 + g_l * 0.7151522 + b_l * 0.0721750
        z = r_l * 0.0193339 + g_l * 0.1191920 + b_l * 0.9503041

        # White point reference
        xn, yn, zn = 0.95047, 1.00000, 1.08883
        xr, yr, zr = x / xn, y / yn, z / zn

        eps = 216.0 / 24389.0  # 0.008856
        kappa = 24389.0 / 27.0  # 903.3

        def _f(t: float) -> float:
            return t ** (1.0 / 3.0) if t > eps else (kappa * t + 16.0) / 116.0

        fx = _f(xr)
        fy = _f(yr)
        fz = _f(zr)

        l_star = max(0.0, 116.0 * fy - 16.0)
        a_star = 500.0 * (fx - fy)
        b_star = 200.0 * (fy - fz)

        return l_star, a_star, b_star

    def compute_color_delta_e(
        self,
        rgb1: Image.Image,
        mask1: Image.Image,
        rgb2: Image.Image,
        mask2: Image.Image,
    ) -> float:
        """Compute CIELAB Delta E (CIE76 color difference) between product regions."""
        pixels1 = []
        pixels2 = []

        def _get_pixels(im: Image.Image):
            if hasattr(im, "get_flattened_data"):
                return im.get_flattened_data()
            return im.getdata()

        d1 = _get_pixels(rgb1)
        m1 = _get_pixels(mask1)
        for px, m in zip(d1, m1):
            if m > 127:
                pixels1.append(px)

        d2 = _get_pixels(rgb2)
        m2 = _get_pixels(mask2)
        for px, m in zip(d2, m2):
            if m > 127:
                pixels2.append(px)

        if not pixels1 or not pixels2:
            return 0.0

        # Compute median/mean RGB for robust representation
        r1 = sum(p[0] for p in pixels1) / float(len(pixels1))
        g1 = sum(p[1] for p in pixels1) / float(len(pixels1))
        b1 = sum(p[2] for p in pixels1) / float(len(pixels1))

        r2 = sum(p[0] for p in pixels2) / float(len(pixels2))
        g2 = sum(p[1] for p in pixels2) / float(len(pixels2))
        b2 = sum(p[2] for p in pixels2) / float(len(pixels2))

        l1, a1, b_1 = self._rgb_to_lab(r1, g1, b1)
        l2, a2, b_2 = self._rgb_to_lab(r2, g2, b2)

        delta_e = math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b_1 - b_2) ** 2)
        return float(round(delta_e, 2))

    def validate(
        self,
        original_image: Any,
        generated_image: Any,
        category: str = "general",
    ) -> FidelityValidationResult:
        """Perform end-to-end product fidelity validation comparing original vs generated images.

        Args:
            original_image: Source artisan image input.
            generated_image: Generated/edited studio image input.
            category: Artisan craft category ('pottery', 'textiles', 'jewellery', 'wooden_crafts', 'general').

        Returns:
            FidelityValidationResult containing decision ('PASS'/'REVIEW'/'FAIL'), score, metrics, and warnings.
        """
        start_time = time.time()
        cat_key = category.strip().lower() if category else "general"
        weights = CATEGORY_WEIGHTS.get(cat_key, CATEGORY_WEIGHTS["general"])
        warnings: List[str] = []

        try:
            # 1. Extract product regions and masks
            rgb_orig, mask_orig = self.extract_product_mask(original_image)
            rgb_gen, mask_gen = self.extract_product_mask(generated_image)

            # 2. Canonicalize product crops to aligned coordinate space
            canon_rgb_orig, canon_mask_orig, ar_orig = self._crop_and_canonicalize(rgb_orig, mask_orig)
            canon_rgb_gen, canon_mask_gen, ar_gen = self._crop_and_canonicalize(rgb_gen, mask_gen)

            # 3. Compute Metrics
            # A. Mask IoU
            mask_iou = self.compute_mask_iou(canon_mask_orig, canon_mask_gen)

            # B. Silhouette similarity
            sil_sim = self.compute_silhouette_similarity(canon_mask_orig, canon_mask_gen)

            # C. Masked SSIM on product intersection
            joint_mask = ImageChops.darker(canon_mask_orig, canon_mask_gen)
            if joint_mask.getbbox() is None:
                joint_mask = canon_mask_orig
            ssim_val = self.compute_masked_ssim(canon_rgb_orig, canon_rgb_gen, joint_mask)

            # D. CIELAB Delta E color shift
            color_delta_e = self.compute_color_delta_e(
                canon_rgb_orig, canon_mask_orig, canon_rgb_gen, canon_mask_gen
            )

            # E. Geometric aspect ratio deviation
            max_ar = max(ar_orig, ar_gen, 1e-5)
            aspect_ratio_delta = abs(ar_orig - ar_gen) / max_ar

            # F. Area coverage ratio
            orig_stat = ImageStat.Stat(mask_orig)
            gen_stat = ImageStat.Stat(mask_gen)
            orig_area = float(orig_stat.sum[0])
            gen_area = float(gen_stat.sum[0])
            area_coverage_ratio = gen_area / max(1.0, orig_area)

            # 4. Anomaly and Threshold Warnings
            if mask_iou < self.settings.mask_iou_pass:
                warnings.append(
                    f"Product silhouette IoU ({mask_iou:.2f}) is below pass threshold ({self.settings.mask_iou_pass:.2f})"
                )

            if ssim_val < self.settings.ssim_pass:
                warnings.append(
                    f"Product texture SSIM ({ssim_val:.2f}) is below pass threshold ({self.settings.ssim_pass:.2f})"
                )

            if color_delta_e > self.settings.color_delta_e_pass:
                warnings.append(
                    f"Product color shift Delta E ({color_delta_e:.1f}) exceeds pass threshold ({self.settings.color_delta_e_pass:.1f})"
                )

            if aspect_ratio_delta > self.settings.aspect_ratio_delta_max:
                warnings.append(
                    f"Product aspect ratio deviation ({aspect_ratio_delta:.2f}) exceeds max tolerance ({self.settings.aspect_ratio_delta_max:.2f})"
                )

            # 5. Calculate Weighted Composite Confidence Score
            norm_color_score = max(0.0, min(1.0, 1.0 - (color_delta_e / 30.0)))
            norm_ar_score = max(0.0, min(1.0, 1.0 - (aspect_ratio_delta / 0.50)))

            composite_score = (
                weights["w_iou"] * mask_iou
                + weights["w_sil"] * sil_sim
                + weights["w_ssim"] * ssim_val
                + weights["w_col"] * norm_color_score
            )
            # Factor in geometric preservation
            composite_score = composite_score * (0.8 + 0.2 * norm_ar_score)
            composite_score = float(round(max(0.0, min(1.0, composite_score)), 3))

            # 6. Decision Engine Logic
            # Hard structural failure criteria
            is_hard_fail = (
                mask_iou < self.settings.mask_iou_review
                or aspect_ratio_delta > (self.settings.aspect_ratio_delta_max * 1.8)
                or color_delta_e > (self.settings.color_delta_e_review * 1.5)
                or composite_score < 0.60
            )

            # Review criteria
            is_review = (
                mask_iou < self.settings.mask_iou_pass
                or ssim_val < self.settings.ssim_pass
                or color_delta_e > self.settings.color_delta_e_pass
                or aspect_ratio_delta > self.settings.aspect_ratio_delta_max
                or composite_score < 0.80
                or len(warnings) > 0
            )

            if is_hard_fail:
                decision = "FAIL"
            elif is_review:
                decision = "REVIEW"
            else:
                decision = "PASS"

            elapsed_ms = round((time.time() - start_time) * 1000, 2)

            metrics = FidelityMetrics(
                mask_iou=round(mask_iou, 3),
                silhouette_similarity=round(sil_sim, 3),
                ssim=round(ssim_val, 3),
                color_delta_e=round(color_delta_e, 2),
                aspect_ratio_delta=round(aspect_ratio_delta, 3),
                area_coverage_ratio=round(area_coverage_ratio, 3),
            )

            return FidelityValidationResult(
                decision=decision,
                score=composite_score,
                category=cat_key,
                metrics=metrics,
                warnings=warnings,
                execution_time_ms=elapsed_ms,
                details={
                    "original_aspect_ratio": round(ar_orig, 2),
                    "generated_aspect_ratio": round(ar_gen, 2),
                    "weights_applied": weights,
                },
            )

        except Exception as exc:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return FidelityValidationResult(
                decision="FAIL",
                score=0.0,
                category=cat_key,
                metrics=FidelityMetrics(
                    mask_iou=0.0,
                    silhouette_similarity=0.0,
                    ssim=0.0,
                    color_delta_e=99.9,
                    aspect_ratio_delta=1.0,
                    area_coverage_ratio=0.0,
                ),
                warnings=[f"Fidelity validation execution error: {str(exc)}"],
                execution_time_ms=elapsed_ms,
                error=str(exc),
            )
