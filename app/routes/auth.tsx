import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  return json({
    ENV: {
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    },
  });
}

export default function Auth() {
  const {
    ENV: { GITHUB_CLIENT_ID, GITHUB_TOKEN },
  } = useLoaderData();

  return (
    <a
      href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${GITHUB_TOKEN}`}
    >
      Something
    </a>
  );
}
