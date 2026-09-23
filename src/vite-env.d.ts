/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_JS_KEY?: string;
  readonly VITE_FALLBACK_SIDO_CODE?: string;
  readonly VITE_FALLBACK_SIGUNGU_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
