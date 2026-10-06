import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  // Packt JavaScript und CSS direkt in die index.html — eine Datei hochladen genügt
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  // Relative Pfade: die App läuft auch in einem Unterordner (z. B. /schreiben/)
  base: "./",
  server: {
    host: true,
    port: 5173,
  },
});
