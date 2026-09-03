import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // pdf-parse (via pdfjs-dist) resolve seu worker (pdf.worker.mjs) a partir
  // do próprio node_modules em tempo de execução — empacotado pelo
  // Turbopack/webpack, esse caminho quebra ("Setting up fake worker
  // failed"). Marcar como externo faz o Next usar o require/import normal
  // do Node em vez de tentar fazer bundle/chunk do pacote.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
