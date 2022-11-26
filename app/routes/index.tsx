import { Link } from "@remix-run/react";

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getPRs, PRByRepo, PR } from "~/models/pr.server";

type LoaderData = {
  // this is a handy way to say: "repos is whatever type getPRs resolves to"
  repos: Awaited<ReturnType<typeof getPRs>>;
};

export const loader = async () => {
  const repos = await getPRs();
  console.log({ repos });

  return json<LoaderData>({
    repos: repos,
  });
};

const PRCard = ({ repo, pr }: { repo: PRByRepo; pr: PR }) => {
  console.log(pr.html_url);

  return (
    <div
      key={`${repo.orgName} ${repo.repoName} ${pr.title}`}
      className="h-13 m-2 flex-1 bg-white p-2 text-sm shadow"
    >
      <div>
        <a
          className="max-w-[90px] overflow-hidden overflow-ellipsis whitespace-nowrap font-bold underline hover:no-underline"
          href={pr.html_url}
          target="_blank"
          rel="noreferrer"
        >
          {pr.title}
        </a>
      </div>
      <div className="flex justify-between">
        <span className="truncate break-all" title={pr.created_at}>
          {pr.age}
        </span>
        <span className="truncate break-all">
          <a
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
            href={`https://github.com/${pr.user.login}`}
          >
            #{pr.id}
          </a>
        </span>
        <span className="truncate break-all">
          <a
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
            href={`https://github.com/${pr.user.login}`}
          >
            {pr.user.login}
          </a>
        </span>
      </div>
    </div>
  );
};

const RepoCard = ({ repo }: { repo: PRByRepo }) => {
  return (
    <>
      <div className="w-full">
        <a
          className="font-bold underline hover:no-underline"
          rel="noreferrer"
          target="_blank"
          href={`https://github.com/${repo.orgName}`}
        >
          {repo.orgName}
        </a>{" "}
        /{" "}
        <a
          className="font-bold underline hover:no-underline"
          rel="noreferrer"
          target="_blank"
          href={`https://github.com/${repo.orgName}`}
        >
          {repo.repoName}
        </a>
      </div>
      {repo.prs.map((pr) => (
        <PRCard key={`${repo.orgName}/${repo.repoName}`} pr={pr} repo={repo} />
      ))}
    </>
  );
};

export default function PRIndex() {
  const { repos } = useLoaderData<LoaderData>();

  return (
    <main className="relative min-h-screen bg-violet-400">
      <div className="relative m-2 flex-wrap bg-violet-200 p-2 shadow sm:flex sm:items-center sm:justify-around">
        {repos.map((repo) => (
          <RepoCard key={repo.repoName} repo={repo} />
        ))}
      </div>
    </main>
  );
}
