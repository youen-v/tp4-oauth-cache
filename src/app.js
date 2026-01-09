import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import authRoutes from "./auth/auth.routes.js";
import oauthRoutes from "./oauth/oauth.routes.js";
import { requireClerkAuth } from "./clerk/clerk.middleware.js";

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
