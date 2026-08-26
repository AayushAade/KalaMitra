from ai.catalog.generator import CatalogGenerator


transcript = """
यह हाथ से बना हुआ नीले रंग का सूती बैग है।
इसे बनने में तीन दिन लगे हैं।
इसमें पारंपरिक फूलों की कढ़ाई है।
"""


generator = CatalogGenerator()

print("Generating catalog...")
print()

result = generator.generate(transcript)

print("========== PRODUCT ==========")
print(result["product"])

print()
print("========== ENGLISH ==========")
print(result["catalog"]["title_en"])
print(result["catalog"]["description_en"])

print()
print("========== HINDI ==========")
print(result["catalog"]["title_hi"])
print(result["catalog"]["description_hi"])

print()
print("========== KEYWORDS ==========")
print(result["catalog"]["keywords"])