import { fetchJson } from "~/utils";

export type PR = {
  number: number;
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

const getUrl = (org: string, repo: string) => {
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

const addAge = (pr: PR): PR & { age: string } => ({
  ...pr,
  age: calculateAge(pr.created_at),
});

const getRepoPRs = async (org: string, repo: string, token: string) => {
  const url = getUrl(org, repo);
  const repoPRs = await await fetchJson<Array<PR>>(url, token);
  const prsWithAge = repoPRs.map(addAge);
  return {
    repoName: repo,
    orgName: org,
    prs: prsWithAge,
  };
};

export async function getPRs(
  token: string,
  selectedRepos: Array<string> = []
): Promise<Array<PRByRepo>> {
  const repoPRs = await Promise.all(
    selectedRepos.map((selectedRepo) => {
      const [org, repo] = selectedRepo.split("/");
      if (!org || !repo) return Promise.resolve([]);

      return getRepoPRs(org, repo, token);
    })
  );

  return repoPRs as Array<PRByRepo>;
}
