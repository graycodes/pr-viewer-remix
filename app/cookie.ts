import { createCookie } from "@remix-run/node";

export const cookieAccessToken = createCookie("access_token", {
  domain: process.env.DEPLOY_DOMAIN,
});

export const cookieUsername = createCookie("username", {
  domain: process.env.DEPLOY_DOMAIN,
});
