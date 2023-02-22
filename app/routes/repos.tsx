import { json, redirect } from "@remix-run/node";
import { cookieAccessToken } from "~/cookie";
import { getRepos } from "~/models/repo.server";

export const loader = async ({ request }: { request: Request }) => {
  const { GITHUB_CLIENT_ID, GITHUB_TOKEN } = process.env;
  if (!GITHUB_CLIENT_ID || !GITHUB_TOKEN) {
    console.error("Missing environment variables");
    process.exit(1);
  }

  const cookies = request.headers.get("Cookie");

  const token = await cookieAccessToken.parse(cookies);
  let repos = [];
  try {
    repos = await getRepos(token);
  } catch (e) {
    return redirect(
      `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${GITHUB_TOKEN}`
    );
  }

  return json({
    repos,
  });
};
