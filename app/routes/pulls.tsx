import { json, redirect } from "@remix-run/node";
import { cookieAccessToken, cookieUsername } from "~/cookie";
import { getPRs } from "~/models/pr.server";

export const loader = async ({ request }: { request: Request }) => {
  const { GITHUB_CLIENT_ID, GITHUB_TOKEN } = process.env;
  if (!GITHUB_CLIENT_ID || !GITHUB_TOKEN) {
    console.error("Missing environment variables");
    process.exit(1);
  }

  const cookies = request.headers.get("Cookie");
  const token = await cookieAccessToken.parse(cookies);
  const username = await cookieUsername.parse(cookies);

  const selectedRepos = new URL(request.url).searchParams
    .get("selectedRepos")
    ?.split(",");

  let pulls = [];
  try {
    pulls = await getPRs(token, selectedRepos, username);
  } catch (e) {
    console.log("GitHub Error, attempting to re-auth");
    return redirect(
      `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${GITHUB_TOKEN}`
    );
  }

  return json(pulls);
};
