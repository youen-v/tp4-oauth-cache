import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../prisma.js";

export function setupPassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const provider = "google";
          const providerId = profile.id;
          const email = profile.emails?.[0]?.value;

          if (!email)
            return done(new Error("Google did not return email"), null);

          let user = await prisma.user.findFirst({
            where: { OR: [{ provider, providerId }, { email }] },
          });

          if (!user) {
            user = await prisma.user.create({
              data: { email, provider, providerId, password: null },
            });
          } else {
            // si user existant local, on peut lier providerId
            if (!user.providerId || user.provider !== provider) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { provider, providerId },
              });
            }
          }

          return done(null, user);
        } catch (e) {
          return done(e, null);
        }
      }
    )
  );

  return passport;
}
