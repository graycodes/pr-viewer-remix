import { createCookie } from "@remix-run/node";

export const cookieAccessToken = createCookie("access_token", {
  domain: "localhost",
});

export const cookieUsername = createCookie("username", {
  domain: "localhost",
});
