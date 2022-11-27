import { Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getPRs, PRByRepo, PR } from "~/models/pr.server";
import { cookieAccessToken, cookieUsername } from "~/cookie";
import { getRepos } from "~/models/repo.server";
import { useEffect, useState } from "react";

type LoaderData = {
  // this is a handy way to say: "repos is whatever type getPRs resolves to"
  pulls: Awaited<ReturnType<typeof getPRs>>;
  repos: Awaited<ReturnType<typeof getRepos>>;
  selectedRepos: Array<string>;
  ENV: {
    GITHUB_CLIENT_ID: string;
    GITHUB_TOKEN: string;
  };
};

export const loader = async ({ request }: { request: Request }) => {
  const cookies = request.headers.get("Cookie");
  const token = await cookieAccessToken.parse(cookies);
  const username = await cookieUsername.parse(cookies);
  const selectedRepos = new URL(request.url).searchParams.getAll("repo");

  const repos = await getRepos(token);
  const pulls = await getPRs(token, selectedRepos);

  return json<LoaderData>({
    pulls,
    repos,
    selectedRepos,
    ENV: {
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
    },
  });
};

const PRCard = ({ pull, pr }: { pull: PRByRepo; pr: PR }) => {
  return (
    <div
      key={`${pull.orgName} ${pull.repoName} ${pr.title}`}
      className="h-13 m-2 flex-1 bg-white p-2 text-sm shadow"
    >
      <div>
        <a
          className="max-w-[90px] overflow-hidden overflow-ellipsis whitespace-nowrap font-bold underline hover:no-underline"
          href={pr.html_url}
          target="_blank"
          rel="noreferrer"
        >
          #{pr.number} {pr.title}
        </a>
      </div>
      <div className="flex justify-between">
        <span className="truncate break-all" title={pr.created_at}>
          {pr.age}
        </span>
        {/* <span className="truncate break-all"></span> */}
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

const RepoCard = ({ pull }: { pull: PRByRepo }) => {
  return (
    <>
      <div className="flex w-full justify-between">
        <div>
          <a
            className="font-bold underline hover:no-underline"
            rel="noreferrer"
            target="_blank"
            href={`https://github.com/${pull.orgName}`}
          >
            {pull.orgName}
          </a>{" "}
          /{" "}
          <a
            className="font-bold underline hover:no-underline"
            rel="noreferrer"
            target="_blank"
            href={`https://github.com/${pull.orgName}/${pull.repoName}`}
          >
            {pull.repoName}
          </a>
        </div>
        <a
          href="#"
          className="m-1 underline hover:no-underline"
          onClick={() => removeRepo(pull)}
        >
          ×
        </a>
      </div>
      {pull.prs.map((pr) => (
        <PRCard
          key={`${pull.orgName}/${pull.repoName}/${pr.number}`}
          pr={pr}
          pull={pull}
        />
      ))}
    </>
  );
};

export function RepoSelector({
  options,
  selectedRepos,
  setSelectedRepos,
}: {
  options: Array<string>;
  selectedRepos: Array<string>;
  setSelectedRepos: (arg0: Array<string>) => void;
}) {
  const [filterText, setFilterText] = useState<string>("");
  const [open, setOpen] = useState(false);

  const opts = options
    .filter((opt) =>
      filterText ? opt.toUpperCase().includes(filterText.toUpperCase()) : true
    )
    .filter((opt) =>
      selectedRepos.length ? !selectedRepos.includes(opt) : true
    );

  const onClick = (opt: string) => () => {
    const path = [...selectedRepos, opt].reduce(
      (newPath, repo) => `${newPath}repo=${repo}&`,
      "?"
    );
    document.location = path;
  };

  return (
    <div>
      {/* <div>
        {selectedRepos.map((repo) => (
          <span
            className="m-1 cursor-pointer bg-white p-1 hover:bg-violet-100"
            key={repo}
            onClick={(e) =>
              setSelectedRepos(selectedRepos.filter((r) => r !== repo))
            }
          >
            {repo}
          </span>
        ))}
      </div> */}
      <div>
        <input
          className="w-80 p-1"
          placeholder="Search repos..."
          type={"text"}
          value={filterText}
          onFocus={(e) => setOpen(true)}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>
      {open && (
        <div
          className="fixed top-0 left-0 h-full w-full"
          onClick={(e) => setOpen(false)}
        ></div>
      )}
      {open && (
        <div className="fixed z-10 h-80 w-80 overflow-scroll bg-violet-100">
          {opts.map((opt) => (
            <span
              className="m-1 block cursor-pointer bg-white p-1 hover:bg-violet-100"
              key={opt}
              onClick={onClick(opt)}
            >
              {opt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PRIndex() {
  const [_, setSelectedRepos] = useState<Array<string>>([]);
  const {
    pulls,
    repos,
    selectedRepos,
    ENV: { GITHUB_CLIENT_ID, GITHUB_TOKEN },
  } = useLoaderData<LoaderData>();

  return (
    <main className="relative min-h-screen bg-violet-500">
      <div className="relative m-2 flex-wrap justify-between bg-violet-200 p-2 shadow sm:flex">
        <a
          className="underline hover:no-underline"
          href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${GITHUB_TOKEN}`}
        >
          Reauthenticate
        </a>
        <RepoSelector
          options={repos.map((repo) => repo.fullName)}
          selectedRepos={selectedRepos}
          setSelectedRepos={setSelectedRepos}
        />
      </div>
      {pulls.map((pull) => (
        <div
          key={pull.repoName}
          className="relative m-2 flex-wrap bg-violet-200 p-2 shadow sm:flex sm:items-center sm:justify-around"
        >
          <RepoCard pull={pull} />
        </div>
      ))}
    </main>
  );
}
