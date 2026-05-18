interface ImportMetaEnv {
  /** Optional Worker URL override for local development. */
  readonly VITE_PROXY_URL?: string;
}
 
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

