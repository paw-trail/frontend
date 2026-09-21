// 후기 사진 — 올릴 서버가 없어 브라우저에서 줄여 저장소에 담는다 (대조표 3/4 1-1)
export const REVIEW_PHOTO_TYPES = ['image/jpeg', 'image/png'] as const;
export const REVIEW_PHOTO_MAX = 5;
const LONG_SIDE = 960;
const QUALITY = 0.8;

/** 긴 변 960px · JPEG 0.8 로 다시 그려 data URL 로 돌려준다 (한 장에 100KB 안팎) */
export async function shrinkPhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('사진을 읽지 못했습니다'));
      el.src = url;
    });
    const scale = Math.min(1, LONG_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('사진을 줄이지 못했습니다');
    ctx.fillStyle = '#ffffff'; // PNG 의 투명한 곳이 검게 나오지 않게
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}
