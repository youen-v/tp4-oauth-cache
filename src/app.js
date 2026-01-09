import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import authRoutes from "./auth/auth.routes.js";
import oauthRoutes from "./oauth/oauth.routes.js";
import { requireClerkAuth } from "./clerk/clerk.middleware.js";
import { cacheAllGet } from "./cache/cacheGet.js";
import { invalidateOnWrite } from "./cache/cacheInvalid.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(
  cacheAllGet({
    defaultTtlMs: 30_000,
    privateTtlMs: 10_000,
    exclude: [/^\/auth\b/, /^\/oauth\b/],
  })
);

app.use(invalidateOnWrite());

app.get("/", (req, res) => res.json({ ok: true, message: "TP Auth Node API" }));

app.use("/auth", authRoutes);
app.use("/oauth", oauthRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(
    `API running on ${process.env.BASE_URL || `http://localhost:${port}`}`
  )
);

app.get("/clerk/me", requireClerkAuth, (req, res) => {
  res.json({ ok: true, clerkUserId: req.clerk.userId });
});

app.get("/cache-test", async (req, res) => {
  await new Promise((r) => setTimeout(r, 300));
  res.json({ ok: true, now: Date.now() });
});
