from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).resolve().parents[1]
source = Image.open(root / "public" / "brand" / "aifrogi-logo-transparent.png").convert("RGBA")
red, green, blue, alpha = source.split()
# The legacy source contains an opaque black mat. Build transparency from the
# brightest colour channel so only the established mark and wordmark remain.
visible = ImageChops.lighter(ImageChops.lighter(red, green), blue)
alpha = ImageChops.multiply(alpha, visible)

for filename, colour in (("aifrogi-logo-white.png", (255, 255, 255)), ("aifrogi-logo-black.png", (16, 16, 16))):
    output = Image.new("RGBA", source.size, (*colour, 0))
    output.putalpha(alpha)
    output.save(root / "public" / "brand" / filename, optimize=True)
