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
  draft: boolean;
  reviewer: boolean;
  requested_reviewers: Array<{ login: string }>;
  comments?: number;
  approvals?: number;
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

const getCommentsUrl = (org: string, repo: string, prNumber: number) => {
  if (!repo) throw new Error("missing repo");
  if (!org) throw new Error("missing org");
  return `https://api.github.com/repos/${org}/${repo}/issues/${prNumber}/comments`;
};

const getApprovalsUrl = (org: string, repo: string, prNumber: number) => {
  if (!repo) throw new Error("missing repo");
  if (!org) throw new Error("missing org");
  return `https://api.github.com/repos/${org}/${repo}/pulls/${prNumber}/reviews`;
};

const calculateAge = (createdAt: string) => {
  const date = +new Date(createdAt);
  const now = +new Date();
  const diffDays = ~~((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays) return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;

  const diffHours = ~~((now - date) / (1000 * 60 * 60));
  return diffHours ? `${diffHours} hours ago` : `now`;
};

const addAge = (pull: Pull): Pull => ({
  ...pull,
  age: calculateAge(pull.created_at)
});

const getCommentsForPR = async (org: string, repo: string, token: string, prNumber: number) => {
  const url = getCommentsUrl(org, repo, prNumber);

  let response;
  try {
    response = await fetchJson<Array<Pull> | GHError>(url, token);
  } catch (e) {
    console.warn("Could not get pulls for repo", e);
    return 0; // empty
  }

  if (isGHError(response)) throw new Error("GitHub returned an error");

  return response.length;
};
const getApprovalsForPR = async (org: string, repo: string, token: string, prNumber: number) => {
  const url = getApprovalsUrl(org, repo, prNumber);

  let response;
  try {
    response = await fetchJson<Array<Pull> | GHError>(url, token);
  } catch (e) {
    console.warn("Could not get pulls for repo", e);
    return 0; // empty
  }

  if (isGHError(response)) throw new Error("GitHub returned an error");

  return response.filter(review => review.state === 'APPROVED').length;
};


const addReviewer =
  (username: string) =>
  (pull: Pull): Pull => ({
    ...pull,
    reviewer: pull.requested_reviewers.map((rr) => rr.login).includes(username)
  });

const addComments = (org: string, repo: string, token: string) => async (pull: Pull): Promise<Pull> => {
  const comments = await getCommentsForPR(org, repo, token, pull.number);

  return {
    ...pull,
    comments
  };
};
const addApprovals = (org: string, repo: string, token: string) => async (pull: Pull): Promise<Pull> => {
  const approvals = await getApprovalsForPR(org, repo, token, pull.number);

  return {
    ...pull,
    approvals
  };
};

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

  if (isGHError(response)) throw new Error("GitHub returned an error");

  let pulls = response.map(addAge);
  pulls = pulls.map(addReviewer(username));
  pulls = await Promise.all(pulls.map(addComments(org, repo, token)));
  pulls = await Promise.all(pulls.map(addApprovals(org, repo, token)));

  return {
    repoName: repo,
    orgName: org,
    pulls,
  };
};

export async function getPRs(
  token: string,
  selectedRepos: Array<string> = [],
  username: string
): Promise<Array<PullsByRepo>> {
  const responses = selectedRepos.map((selectedRepo) => {
    const [org, repo] = selectedRepo.split("/");
    if (!org || !repo) return Promise.resolve([]);

    return getRepoPRs(org, repo, token, username);
  });

  const result = await Promise.all(responses);

  return result as Array<PullsByRepo>;
}
