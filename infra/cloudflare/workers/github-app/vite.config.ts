// Délégué de build imposé par `cf deploy` (aucune autre utilisation de vite dans ce Worker).
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [cloudflare()] });
