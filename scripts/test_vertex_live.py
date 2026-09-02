"""Live Vertex AI Connection & Image Generation Verification Script (Phase 1).

Executes a real test request against Google Cloud Vertex AI / GenAI
to verify authentication, model availability, and image payload responses.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys
import time

# Ensure repo root is on sys.path
_repo_root = Path(__file__).resolve().parents[1]
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from dotenv import load_dotenv
load_dotenv(_repo_root / ".env", override=True)

from backend.app.core.vertex_config import get_vertex_ai_config
from backend.app.services.image_processing import ImageProcessingService, VertexAIImageProvider


def run_live_vertex_test(prompt: str, aspect_ratio: str = "1:1"):
    """Execute live Vertex AI verification test."""
    cfg = get_vertex_ai_config()

    print("========================================================")
    print("  PHASE 1 — VERTEX AI IMAGE FOUNDATION VERIFICATION")
    print("========================================================")
    print(f"Project ID   : {cfg.project_id or '(Not set — checking ADC / API Key)'}")
    print(f"Location     : {cfg.location}")
    print(f"Image Model  : {cfg.image_model}")
    print(f"Auth Method  : {'Google Cloud ADC / Vertex AI' if cfg.project_id else ('Developer Key Fallback' if cfg.api_key else 'None configured')}")
    print("--------------------------------------------------------")

    provider = VertexAIImageProvider(settings=cfg)
    service = ImageProcessingService(provider=provider)

    print("[Step 1/2] Verifying Cloud Authentication & Connectivity...")
    conn = service.verify_provider_connection()
    print(f"  Status       : {conn.get('connection_status')}")
    print(f"  Authenticated: {conn.get('authenticated')}")
    if conn.get("error"):
        print(f"  Error Detail : {conn.get('error')} ({conn.get('error_code')})")

    print("\n[Step 2/2] Sending Real Test Request to Vertex AI...")
    start_t = time.time()
    result = service.test_generate_image(
        prompt=prompt,
        aspect_ratio=aspect_ratio,
    )
    elapsed_s = time.time() - start_t

    print("--------------------------------------------------------")
    print(f"EXECUTION RESULT ({elapsed_s:.2f}s total)")
    print("--------------------------------------------------------")
    print(f"Success         : {result.success}")
    print(f"Provider        : {result.provider}")
    print(f"Operation       : {result.operation}")

    if result.success:
        meta = result.metadata or {}
        byte_count = meta.get("byte_count", 0)
        print(f"Image Received  : YES ({byte_count} bytes)")
        print(f"Output Format   : {result.output_format}")
        print(f"Model Used      : {meta.get('model')}")
        print("REAL Vertex AI request was successfully executed and verified!")
    else:
        print(f"Error Code      : {result.error_code}")
        print(f"Error Message   : {result.error}")
        print("Note: If Vertex AI project quota or ADC is not active, see error details above.")

    print("========================================================\n")
    return 0 if result.success else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Phase 1 Vertex AI Live Test")
    parser.add_argument(
        "--prompt",
        default="A luxury handcrafted Indian terracotta vase on a minimalist stone podium, soft warm studio lighting, 8k e-commerce photo",
        help="Test prompt",
    )
    parser.add_argument("--aspect_ratio", default="1:1", help="Aspect ratio (default: 1:1)")
    args = parser.parse_args()

    sys.exit(run_live_vertex_test(args.prompt, args.aspect_ratio))
