import { fetchJson } from "~/utils";

export interface Pull {
  number: number;
  title: string;
  age: string;
  state: string;
  created_at: string;
  html_url: string;
  user: {
    login: string;
  };
  reviewer: boolean;
  requested_reviewers: Array<{ login: string }>;
}

export interface PullsByRepo {
  repoName: string;
  orgName: string;
  pulls: Array<Pull>;
}

export interface GHError {
  message: string;
}

const isGHError = (arg: Pull[] | GHError): arg is GHError => "message" in arg;

const getOpenPullsUrl = (org: string, repo: string) => {
  if (!repo) throw new Error("missing repo");
  if (!org) throw new Error("missing org");
  return `https://api.github.com/repos/${org}/${repo}/pulls?state=open`;
};

const calculateAge = (createdAt: string) => {
  const date = +new Date(createdAt);
  const now = +new Date();
  const diffDays = ~~((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays) return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;

  const diffHours = ~~((now - date) / (1000 * 60 * 60));
  return diffHours ? `${diffHours} hours ago` : `now`;
};

const addAge = (pull: Pull): Pull & { age: string } => ({
  ...pull,
  age: calculateAge(pull.created_at),
});

const addReviewer =
  (username: string) =>
  (pull: Pull): Pull & { reviewer: boolean } => ({
    ...pull,
    reviewer: pull.requested_reviewers.map((rr) => rr.login).includes(username),
  });

const getRepoPRs = async (
  org: string,
  repo: string,
  token: string,
  username: string
) => {
  const url = getOpenPullsUrl(org, repo);

  let response;
  try {
    response = await fetchJson<Array<Pull> | GHError>(url, token);
  } catch (e) {
    console.warn("Could not get pulls for repo", e);
    return { repoName: repo, orgName: org, pulls: [] }; // empty
  }

  if (isGHError(response))
    return {
      repoName: repo,
      orgName: org,
      pulls: [{ user: {}, title: `Error: ${response.message}` }],
    };

  return {
    repoName: repo,
    orgName: org,
    pulls: response.map(addAge).map(addReviewer(username)),
  };
};

export async function getPRs(
  token: string,
  selectedRepos: Array<string> = [],
  username: string
): Promise<Array<PullsByRepo>> {
  const repoPRs = await Promise.all(
    selectedRepos.map((selectedRepo) => {
      const [org, repo] = selectedRepo.split("/");
      if (!org || !repo) return Promise.resolve([]);

      return getRepoPRs(org, repo, token, username);
    })
  );

  return repoPRs as Array<PullsByRepo>;
}
