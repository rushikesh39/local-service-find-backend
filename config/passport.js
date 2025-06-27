const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            user.provider = "google";
            await user.save();
          }
          return done(null, user);
        } else {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            isVerified: true,
            role: "user",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FB_CLIENT_ID,
      clientSecret: process.env.FB_CLIENT_SECRET,
      callbackURL: process.env.FB_CALLBACK_URL,
      profileFields: ["id", "displayName", "emails"],
      scope: ["email"], // Add this line
      enableProof: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // console.log("profile",profile)
        let email =profile.emails?.[0]?.value || `fb-${profile.id}@facebook.com`;
        let user = await User.findOne({ email });
        if (user) {
          if (!user.facebookId) {
            user.facebookId = profile.id;
            user.provider = "facebook";
            await user.save();
          }
          return done(null, user);
        } else {
          user = await User.create({
            name: profile.displayName,
            email:
              profile.emails?.[0]?.value || `fb-${profile.id}@facebook.com`,
            facebookId: profile.id,
            isVerified: true,
            role: "user",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) =>
  User.findById(id).then((user) => done(null, user))
);
