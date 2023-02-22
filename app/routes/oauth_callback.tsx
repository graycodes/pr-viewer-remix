import { redirect } from "@remix-run/node";
import { cookieAccessToken, cookieUsername } from "~/cookie";
import { createOAuthAppAuth } from "@octokit/auth-oauth-app";

export const loader = async ({ request: req }: { request: Request }) => {
  const params = new URL(req.url).searchParams;
  const code = params.get("code");

  const {GITHUB_CLIENT_ID,GITHUB_SECRET, GITHUB_TOKEN, DEPLOY_URL } = process.env;

  if (!code) {
    console.error("no code set in oauth_callback");
    return null;
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_SECRET || !GITHUB_TOKEN || !DEPLOY_URL) {
    console.error('Missing environment variables!')
    process.exit(1);
  }

  const auth = createOAuthAppAuth({
    clientType: "oauth-app",
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_SECRET,
  });

  const {token} = await auth({
    type: "oauth-user",
    code: code,
    state: GITHUB_TOKEN,
  });

  const userRaw = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${token}`,
    },
  });
  const user = await userRaw.json();
  const username = user.login;

  return redirect(DEPLOY_URL, {
    headers: [
      ["Set-Cookie", await cookieAccessToken.serialize(token)],
      ["Set-Cookie", await cookieUsername.serialize(username)],
    ],
  });
};
