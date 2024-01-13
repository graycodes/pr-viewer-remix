export type Repo = { fullName: string; selected: boolean };
export type GHRepo = {
  full_name: string;
};

export async function getRepos(token: string): Promise<Repo[]> {
  let orgs: GHRepo[] = [];
  let next: string | undefined =
    "<https://api.github.com/user/repos?per_page=100>;";

  while (next) {
    const newNext: string[] = next.split(";");
    const nextLink = newNext[0].slice(1, -1);
    const headers = { headers: { Authorization: `token ${token}` } };

    let orgsRaw, orgsNew;
    try {
      orgsRaw = await fetch(nextLink, headers);
      orgsNew = await orgsRaw.json();
    } catch (e) {
      console.warn('Failed to fetch / parse next link', e);
      return []; // ?
    }

    if (orgsNew.message === "Bad credentials")
      throw new Error("Bad Credentials");

    orgs = orgs.concat(orgsNew);

    next = (orgsRaw.headers.get("link") || "")
      .split(", ")
      .find((u) => u.indexOf("next") > -1);
  }

  return orgs.map((repo) => ({
    fullName: repo.full_name,
    selected: false,
  }));
}
