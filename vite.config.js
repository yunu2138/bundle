
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

import schedulesHandler from "./api/schedules.js";
import scheduleByIdHandler from "./api/schedules/[id].js";
import adminPasswordHandler from "./api/admin-password.js";
import verifyCodeHandler from "./api/verify-code.js";

const serverEnvKeys = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_CODE",
  "TOKEN_SECRET",
];

function localApiPlugin() {
  const handlers = new Map([
    ["/api/schedules", schedulesHandler],
    ["/api/admin-password", adminPasswordHandler],
    ["/api/verify-code", verifyCodeHandler],
  ]);

  const bodyLimit = 64 * 1024;

  return {
    name: "local-serverless-api",

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        const url = new URL(req.url, "http://localhost");

        const itemMatch = url.pathname.match(
          /^\/api\/schedules\/([^/]+)$/
        );

        const handler = itemMatch
          ? scheduleByIdHandler
          : handlers.get(url.pathname);

        if (!handler) return next();

        req.query = Object.fromEntries(url.searchParams.entries());

        if (itemMatch) {
          try {
            req.query.id = decodeURIComponent(itemMatch[1]);
          } catch {
            req.query.id = itemMatch[1];
          }
        }

        res.status = (status) => {
          res.statusCode = status;
          return res;
        };

        res.json = (body) => {
          res.setHeader(
            "Content-Type",
            "application/json; charset=utf-8"
          );
          res.end(JSON.stringify(body));
          return res;
        };

        if (req.method !== "GET" && req.method !== "DELETE") {
          const chunks = [];
          let size = 0;

          for await (const chunk of req) {
            size += chunk.length;

            if (size > bodyLimit) {
              return res.status(413).json({
                error: "요청 내용이 너무 커요.",
              });
            }

            chunks.push(chunk);
          }

          if (size) {
            try {
              req.body = JSON.parse(
                Buffer.concat(chunks).toString("utf8")
              );
            } catch {
              return res.status(400).json({
                error: "요청 내용을 확인해 주세요.",
              });
            }
          }
        }

        try {
          await handler(req, res);
        } catch (error) {
          console.error(
            `Local API ${req.method} ${url.pathname}:`,
            error instanceof Error
              ? error.message
              : "알 수 없는 오류"
          );

          if (!res.headersSent) {
            res.status(500).json({
              error:
                "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
            });
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    process.env.SUPABASE_URL = supabaseUrl;
  }

  for (const key of serverEnvKeys) {
    if (!process.env[key] && env[key]) {
      process.env[key] = env[key];
    }
  }

  return {
    base: process.env.VERCEL ? "/" : "/bundle/",
    plugins: [react(), localApiPlugin()],
    build: {
      outDir: "docs",
      emptyOutDir: true,
    },
  };
});
