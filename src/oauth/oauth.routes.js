import { Router } from "express";
import passport from "passport";
import { setupPassport } from "./oauth.passport.js";
import { issueTokensForUser } from "../auth/auth.controller.js";

const router = Router();
setupPassport();

router.use(passport.initialize());

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/oauth/fail",
  }),
  async (req, res) => {
    const { accessToken } = issueTokensForUser(res, req.user);
    const redirectUrl = new URL(process.env.FRONT_URL);
    redirectUrl.pathname = "/oauth-success";
    redirectUrl.searchParams.set("token", accessToken);
    return res.redirect(redirectUrl.toString());
  }
);

router.get("/fail", (req, res) => res.status(401).send("OAuth failed"));

export default router;
