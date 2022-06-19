"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var passport = require("passport");
var OpenIDConnectStrategy = require("passport-openidconnect");
let OAuth2Strategy = require("passport-oauth2");
var express = require("express");
var qs = require("querystring");
// passport.use(
//   new OpenIDConnectStrategy(
//     {
//       issuer: process.env["KEYCLOAK_ISSUER"],
//       authorizationURL: process.env["KEYCLOAK_AUTH_URL"],
//       tokenURL: process.env["KEYCLOAK_TOKEN_URL"],
//       userInfoURL: process.env["KEYCLOAK_USERINFO_URL"],
//       clientID: process.env["KEYCLOAK_CLIENT_ID"],
//       clientSecret: process.env["KEYCLOAK_CLIENT_SECRET"],
//       callbackURL: "/oauth2/redirect",
//       scope: ["profile"],
//     },
//     function verify(issuer: string, profile: any, cb: Function) {
//       // !!!!!!!!!! TODO !!!!!
//       // Add user to DB if not present
//       return cb(null, profile);
//     }
//   )
// );
passport.use(new OAuth2Strategy({
    authorizationURL: process.env["KEYCLOAK_AUTH_URL"],
    tokenURL: process.env["KEYCLOAK_TOKEN_URL"],
    clientID: process.env["KEYCLOAK_CLIENT_ID"],
    clientSecret: process.env["KEYCLOAK_CLIENT_SECRET"],
    callbackURL: "http://localhost:3000//oauth2/redirect",
}, function (accessToken, refreshToken, profile, cb) {
    console.log(accessToken);
    console.log(JSON.stringify(profile, 4));
    //User.findOrCreate({ exampleId: profile.id }, function (err, user) {
    return cb(null, profile);
    //});
}));
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username, name: user.displayName });
    });
});
passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});
var router = express.Router();
router.get("/login", passport.authenticate("oauth2")); // ("openidconnect"));
router.get("/oauth2/redirect", passport.authenticate("oauth2", {
    successRedirect: "/",
    failureRedirect: "/login",
}));
router.post("/logout", function (req, res, next) {
    //console.log(`token : ${JSON.stringify(req.headers, 4)}`);
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        var params = {
            client_id: process.env["KEYCLOAK_CLIENT_ID"],
            redirect_url: "http://localhost:3000",
            // XXX TODO
            // Fix logout. FIrst make url an .env var
            // Redirectly url above doesn't seem to redirect after Keycloak logout
            // User is stuck in a Keycloak page and must click Back a a few times to get back to App
            //
            // If we pass post_logout_redirect_uri,
            // Keycloak wants id_token_hint to be a valid token issued to us
            //post_logout_redirect_uri: "http://localhost:3000",
            // id_token_hint: "", // req.headers.authorization.split(" ")[1],
            prompt: "none",
        };
        res.redirect(`${process.env["KEYCLOAK_LOGOUT_URL"]}?` + qs.stringify(params));
    });
});
module.exports = router;
