import { fetchJson } from "~/utils";

export type PR = {
  id: number;
  title: string;
  age: string;
  state: string;
  created_at: string;
  html_url: string;
  user: {
    login: string;
  };
};

export type PRByRepo = {
  repoName: string;
  orgName: string;
  prs: Array<PR>;
};

const getUrl = (org: string, repo: string, token: string, username: string) => {
  if (!username) throw new Error("missing GITHUB_USERNAME");
  if (!token) throw new Error("missing GITHUB_TOKEN");
  if (!repo) throw new Error("missing repo");
  if (!org) throw new Error("missing org");
  return `https://${username}:${token}@api.github.com/repos/${org}/${repo}/pulls?state=open`;
};

const calculateAge = (createdAt: string) => {
  const date = +new Date(createdAt);
  const now = +new Date();
  const diffDays = ~~((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays) return diffDays === 1 ? "1 day" : `${diffDays} days`;

  const diffHours = ~~((now - date) / (1000 * 60 * 60));
  return diffHours ? `${diffHours} hours` : `now`;
};

const addAge = (pr: PR): PR & { age: string } => {
  const age = calculateAge(pr.created_at) + " ago";
  return { ...pr, age };
};

const getRepoPRs = async (
  org: string,
  repo: string,
  token: string,
  username: string
) => {
  const url = getUrl(org, repo, token, username);
  console.log({ url });
  const repoPRs = await (await fetchJson<Array<PR>>(url)).map(addAge);
  return {
    repoName: repo,
    orgName: org,
    prs: repoPRs,
  };
};

export async function getPRs(): Promise<Array<PRByRepo>> {
  const repoPRs = await getRepoPRs(
    // "statsbomb",
    // "react-components",
    "facebook",
    "react",
    "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",
    "graycodes"
  );

  // console.log({ repoPRs });

  return [repoPRs] as Array<PRByRepo>;

  return [
    {
      repoName: "foo",
      orgName: "bar",
      prs: [
        {
          age: "my-first-post",
          title: "My First Post",
        },
        {
          age: "90s-mixtape",
          title: "A Mixtape I Made Just For You",
        },
        {
          age: "90",
          title: "A You",
        },
        {
          age: "9mixtape",
          title: "A Mixtape  Just ",
        },
      ],
    },
  ];
}
