import io
from typing import List
from PIL import Image

def image_array_to_hex(images: List[Image.Image]):
    # Would love a means to convert within a list comprehension; however,
    # extracting formatted data requires saving to a file.

    results = []

    for image in images:
        imageData = io.StringIO() # Uncertain as to whether this is cleared on write by save; better safe than sorry.
        image.save(imageData, "png")

        results.append(imageData.getvalue())
        imageData.close()

    return results