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

    const orgsRaw = await fetch(nextLink, headers);
    const orgsNew = await orgsRaw.json();

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
