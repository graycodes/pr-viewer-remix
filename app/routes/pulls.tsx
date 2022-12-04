import { json } from "@remix-run/node";
import { cookieAccessToken, cookieUsername } from "~/cookie";
import { getPRs } from "~/models/pr.server";

export const loader = async ({ request }: { request: Request }) => {
  const cookies = request.headers.get("Cookie");
  console.log("cookie", request.headers.get("Cookie"));

  const token = await cookieAccessToken.parse(cookies);
  const username = await cookieUsername.parse(cookies);
  const selectedRepos = new URL(request.url).searchParams
    .get("selectedRepos")
    ?.split(",");

  console.log("selrep", selectedRepos);

  const pulls = await getPRs(token, selectedRepos);

  return json({
    pulls,
  });
};
