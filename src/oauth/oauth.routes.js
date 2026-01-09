import { Router } from "express";
import passport from "passport";
import { setupPassport } from "./oauth.passport.js";
import { issueTokensForUser } from "../auth/auth.controller.js";

const router = Router();
setupPassport();

router.use(passport.initialize());

// 1) démarre le flow Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 2) callback Google
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/oauth/fail",
  }),
  async (req, res) => {
    // req.user vient de la strategy (user DB)
    const { accessToken } = issueTokensForUser(res, req.user);

    // Option A: renvoyer JSON (si tu testes avec Postman/curl)
    // return res.json({ accessToken });

    // Option B: redirect vers le front avec token
    const redirectUrl = new URL(process.env.FRONT_URL);
    redirectUrl.pathname = "/oauth-success";
    redirectUrl.searchParams.set("token", accessToken);
    return res.redirect(redirectUrl.toString());
  }
);

router.get("/fail", (req, res) => res.status(401).send("OAuth failed"));

export default router;
