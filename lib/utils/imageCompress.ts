/**
 * Compress an image (from File or base64 data-URL) to a smaller JPEG.
 * Default: max 700px wide, 0.60 JPEG quality → ~50-120KB base64 per photo.
 */
export async function compressImage(
  source: string | File,
  maxWidth = 700,
  quality  = 0.60,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const scale  = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas unavailable")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("image load failed"));

    if (typeof source === "string") {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload  = (e) => { img.src = e.target?.result as string; };
      reader.onerror = () => reject(new Error("file read failed"));
      reader.readAsDataURL(source);
    }
  });
}
