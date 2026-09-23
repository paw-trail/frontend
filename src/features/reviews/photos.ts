// 후기 사진 — 올리기 전에 브라우저에서 줄인다 (원본을 그대로 올리면 20MiB 상한에 걸리기 쉽다)
export const REVIEW_PHOTO_TYPES = ['image/jpeg', 'image/png'] as const;
export const REVIEW_PHOTO_MAX = 5;
const LONG_SIDE = 960;
const QUALITY = 0.8;

/**
 * 긴 변 960px · JPEG 0.8 로 다시 그려 올릴 파일을 만든다 (한 장에 100KB 안팎).
 *
 * data URL 이 아니라 File 로 돌려주는 까닭은 S3 서명에 크기가 들어가기 때문이다.
 * 줄인 뒤의 byte 수를 그대로 contentLength 로 보내야 하며, 한 바이트만 달라도 403 이 난다.
 */
export async function shrinkPhoto(file: File): Promise<File> {
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
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob) throw new Error('사진을 줄이지 못했습니다');
    const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}
