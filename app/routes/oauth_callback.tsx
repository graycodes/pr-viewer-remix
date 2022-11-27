import { useLoaderData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { cookieAccessToken, cookieUsername } from "~/cookie";

export default function OauthCallBack() {
  const x = useLoaderData();
  return <p>hi</p>;
}

export const loader = async ({ request: req }: { request: Request }) => {
  const params = new URL(req.url).searchParams;
  const code = params.get("code");

  if (!code) {
    console.error("no code set in oauth_callback");
    return null;
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_SECRET,
      code: code,
      state: process.env.GITHUB_TOKEN,
    }),
  });

  const responseJson = await response.json();
  const access_token = responseJson.access_token;

  const userRaw = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${access_token}`,
    },
  });
  const user = await userRaw.json();
  const username = user.login;

  return redirect("http://localhost:3000", {
    headers: [
      ["Set-Cookie", await cookieAccessToken.serialize(access_token)],
      ["Set-Cookie", await cookieUsername.serialize(username)],
    ],
  });
};
