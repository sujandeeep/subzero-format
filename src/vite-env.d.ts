/// <reference types="vite/client" />

declare module '*.jsonl?raw' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_NOVITA_API_KEY?: string;
  readonly VITE_NOVITA_BASE_URL?: string;
  readonly VITE_NOVITA_MODEL_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

