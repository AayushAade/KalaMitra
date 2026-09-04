import json
import os

from dotenv import load_dotenv
from google import genai

load_dotenv()


class CatalogGenerator:

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not found.")

        self.client = genai.Client(api_key=api_key, vertexai=False)

    def generate(self, transcript: str) -> dict:

        prompt = f"""
You are an expert e-commerce catalog manager helping an Indian artisan
create a professional product listing.

The artisan's speech transcript is:

"{transcript}"

Analyze the transcript and create a structured product catalog.

IMPORTANT RULES:

1. Supported source languages are Hindi, Marathi and English.
2. Detect the language of the transcript.
3. Extract ONLY information that is explicitly stated or reasonably
   identifiable from the transcript.
4. Do NOT invent specifications, materials, colors, measurements,
   certifications, prices or other facts.
5. If information is unavailable, use null.
6. Generate professional e-commerce content suitable for a marketplace.
7. The English description should be polished, concise and professional.
8. The Hindi description should be natural, professional Hindi.
9. Do not provide explanations outside the requested JSON.
10. The JSON is internal application data and will later be rendered
    as a normal product page.

Return ONLY valid JSON in exactly this structure:

{{
    "language": "hi | mr | en",
    "product": {{
        "name": null,
        "category": null,
        "subcategory": null,
        "material": null,
        "colors": [],
        "craft_type": null,
        "production_time_days": null,
        "size": null,
        "additional_details": []
    }},
    "catalog": {{
        "title_en": null,
        "description_en": null,
        "title_hi": null,
        "description_hi": null,
        "keywords": []
    }}
}}
"""

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json"
            }
        )

        return json.loads(response.text)