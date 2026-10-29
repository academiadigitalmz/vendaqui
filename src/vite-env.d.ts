/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_USE_MOCKS?: string;
  readonly VITE_DEFAULT_SKIN?: "academia" | "cakto" | "cakto-laranja";
  readonly VITE_SHOW_SWITCHER?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
