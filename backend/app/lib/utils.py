import io
import base64
from typing import List
from PIL import Image

def image_array_to_hex(images: List[Image.Image]):
    # Would love a means to convert within a list comprehension; however,
    # extracting formatted data requires saving to a file.

    results = []

    for image in images:
        imageData = io.BytesIO() # Uncertain as to whether this is cleared on write by save; better safe than sorry.
        image.save(imageData, "png")

        base64String = base64.b64encode(imageData.getvalue()).decode("utf-8")

        results.append(f"data:image/png;base64, {base64String}")
        imageData.close()

    return results