import { json } from "@remix-run/node";
import { cookieAccessToken } from "~/cookie";
import { getRepos } from "~/models/repo.server";

export const loader = async ({ request }: { request: Request }) => {
  const cookies = request.headers.get("Cookie");

  const token = await cookieAccessToken.parse(cookies);
  const repos = await getRepos(token);

  return json({
    repos,
  });
};
