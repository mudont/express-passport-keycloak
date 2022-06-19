import { NextFunction, Request, Response } from "express";
import type { MyRequest, MyResponse, User } from "../types";
var passport = require("passport");
const OpenIDConnectStrategy = require("passport-openidconnect");
const OAuth2Strategy = require("passport-oauth2");
const KeyCloakStrategy = require("passport-keycloak-oauth2-oidc").Strategy;
var express = require("express");
var qs = require("querystring");

const auth_strategy = "keycloak"; // or "oauth2" or "openidconnect"

// passport.use(
//   new OpenIDConnectStrategy(
//     {
//       issuer: process.env["KEYCLOAK_ISSUER"],
//       authorizationURL: process.env["KEYCLOAK_AUTH_URL"],
//       tokenURL: process.env["KEYCLOAK_TOKEN_URL"],
//       userInfoURL: process.env["KEYCLOAK_USERINFO_URL"],
//       clientID: process.env["KEYCLOAK_CLIENT_ID"],
//       clientSecret: process.env["KEYCLOAK_CLIENT_SECRET"],
//       callbackURL: process.env["KEYCLOAK_AUTH_CALLBACK_URL"],
//       scope: ["profile"],
//     },
//     function verify(issuer: string, profile: any, cb: Function) {
//       // !!!!!!!!!! TODO !!!!!
//       // Add user to DB if not present
//       return cb(null, profile);
//     }
//   )
// );
//
// passport.use(
//   new OAuth2Strategy(
//     {
//       authorizationURL: process.env["KEYCLOAK_AUTH_URL"],
//       tokenURL: process.env["KEYCLOAK_TOKEN_URL"],
//       clientID: process.env["KEYCLOAK_CLIENT_ID"],
//       clientSecret: process.env["KEYCLOAK_CLIENT_SECRET"],
//       callbackURL: process.env["KEYCLOAK_AUTH_CALLBACK_URL"],
//     },
//     function (
//       accessToken: string,
//       refreshToken: string,
//       profile: any,
//       cb: Function
//     ) {
//       console.log(accessToken);
//       console.log(refreshToken);
//       console.log(`profile received from outh2: ${JSON.stringify(profile)}`);

//       //User.findOrCreate({ exampleId: profile.id }, function (err, user) {
//       return cb(null, profile);
//       //});
//     }
//   )
// );

passport.use(
  new KeyCloakStrategy(
    {
      clientID: process.env["KEYCLOAK_CLIENT_ID"],
      realm: "CMHackers",
      publicClient: "false",
      clientSecret: process.env["KEYCLOAK_CLIENT_SECRET"],
      sslRequired: "external",
      authServerURL: process.env["KEYCLOAK_AUTH_ROOT"],
      callbackURL: process.env["KEYCLOAK_AUTH_CALLBACK_URL"],
    },
    function (
      accessToken: string,
      refreshToken: string,
      tokens: any,
      profile: any,
      done: Function
    ) {
      console.log(`idToken: ${tokens.id_token}`);
      console.log(`accessToken: ${accessToken}`);
      console.log(`refreshToken: ${refreshToken}\n`);
      console.log(`profile received from outh2: ${JSON.stringify(profile)}`);
      profile["idToken"] = tokens.id_token;
      profile["accessToken"] = accessToken;
      profile["refreshToken"] = refreshToken;
      //User.findOrCreate(..., function err, user) {
      done(null, profile);
      //});
    }
  )
);
passport.serializeUser(function (user: User, cb: Function) {
  process.nextTick(function () {
    cb(null, {
      id: user.id,
      username: user.username,
      name: user.displayName,
      idToken: user.idToken,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  });
});

passport.deserializeUser(function (user: User, cb: Function) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

var router = express.Router();

//passport.authenticate("oauth2")); // ("openidconnect"));
router.get(
  "/login",
  passport.authenticate(auth_strategy, { scope: ["openid", "profile"] })
);

router.get(
  "/oauth2/redirect",
  passport.authenticate(auth_strategy, {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);
router.post(
  "/logout",
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    //console.log(`token : ${JSON.stringify(req.headers)}`);
    req.logout(function (err: any) {
      if (err) {
        return next(err);
      }
      var params = {
        client_id: process.env["KEYCLOAK_CLIENT_ID"],
        redirect_url: process.env["KEYCLOACK_LOGOUT_REDIRECT_URL"],
        // Redirect url above doesn't seem to redirect after Keycloak logout
        // User is stuck in a Keycloak page and must click Back a a few times to get back to App
        //
        // Below stuff doesn't seem to make any difference :-(
        // post_logout_redirect_uri: process.env["KEYCLOACK_LOGOUT_REDIRECT_URL"],
        // id_token_hint: req.user.idToken,
        // prompt: "none",
      };
      res.redirect(
        `${process.env["KEYCLOAK_LOGOUT_URL"]}?` + qs.stringify(params)
      );
    });
  }
);
module.exports = router;
