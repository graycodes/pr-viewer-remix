import { Link, useFetcher } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getPRs, PRByRepo, PR } from "~/models/pr.server";
import { cookieAccessToken, cookieUsername } from "~/cookie";
import { getRepos } from "~/models/repo.server";
import React, {
  ComponentProps,
  PropsWithChildren,
  ReactPropTypes,
  useEffect,
  useRef,
  useState,
} from "react";

type LoaderData = {
  // this is a handy way to say: "repos is whatever type getPRs resolves to"
  //pulls: Awaited<ReturnType<typeof getPRs>>;
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
  //const pulls = await getPRs(token, selectedRepos);

  return json<LoaderData>({
    // pulls,
    repos,
    selectedRepos,
    ENV: {
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
    },
  });
};

const A: React.FC<{
  className?: string;
  children: React.ReactNode;
  href: string;
  onClick?: () => void;
}> = (props) => (
  <a
    {...props}
    target="_blank"
    rel="noreferrer"
    className={
      "font-bold underline hover:text-violet-500 hover:no-underline " +
      (props.className || "")
    }
  >
    {props.children}
  </a>
);

const PRCard = ({ pull, pr }: { pull: PRByRepo; pr: PR }) => {
  return (
    <div
      key={`${pull.orgName} ${pull.repoName} ${pr.title}`}
      className="h-13 m-2 flex-1 bg-white p-2 text-sm shadow"
    >
      <div>
        <A
          className="max-w-[90px] overflow-hidden overflow-ellipsis whitespace-nowrap"
          href={pr.html_url}
        >
          #{pr.number} {pr.title}
        </A>
      </div>
      <div className="flex justify-between">
        <span className="truncate break-all" title={pr.created_at}>
          {pr.age}
        </span>
        {/* <span className="truncate break-all"></span> */}
        <span className="truncate break-all">
          <A href={`https://github.com/${pr.user.login}`}>{pr.user.login}</A>
        </span>
      </div>
    </div>
  );
};

const RepoCard = ({
  repo,
  removeRepo,
}: {
  repo: PRByRepo;
  removeRepo: (arg0: PRByRepo) => void;
}) => {
  return (
    <>
      <div className="flex w-full justify-between">
        <div>
          <A
            className="text-lg text-violet-700"
            href={`https://github.com/${repo.orgName}`}
          >
            {repo.orgName}
          </A>{" "}
          /{" "}
          <A
            className="text-lg text-violet-700"
            href={`https://github.com/${repo.orgName}/${repo.repoName}`}
          >
            {repo.repoName}
          </A>
        </div>
        <button className="m-1" onClick={() => removeRepo(repo)}>
          ×
        </button>
      </div>
      {repo?.prs?.length === 0 && "There are no open PRs for this repo"}
      {repo.prs &&
        repo.prs.map((pr) => (
          <PRCard
            key={`${repo.orgName}/${repo.repoName}/${pr.number}`}
            pr={pr}
            pull={repo}
          />
        ))}
    </>
  );
};

export function RepoSelector({
  options,
  selectedRepos,
  setSelectedRepos,
  refetch,
}: {
  options: Array<string>;
  selectedRepos: Array<string>;
  setSelectedRepos: (arg0: string[]) => void;
  refetch: (arg0: HTMLFormElement) => void;
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

  const clickGo = () => {
    const path = selectedRepos.reduce(
      (newPath, repo) => `${newPath}repo=${repo}&`,
      "?"
    );
    document.location = path;
  };

  const onClick = (opt: string) => (event) => {
    setOpen(false);
    setSelectedRepos([...selectedRepos, opt]);
    refetch(event.target.form);
  };

  return (
    <div>
      <div>
        <button
          onClick={clickGo}
          className="m-1 bg-violet-200 p-[2px] hover:bg-violet-100"
        >
          Save Params In URL
        </button>
        <input
          className="w-80 border-2  border-violet-200 px-1"
          placeholder="Search repos..."
          type={"text"}
          value={filterText}
          onFocus={(e) => setOpen(true)}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>
      {open && (
        <div
          className="fixed top-0 left-0 z-10 h-full w-full"
          onClick={(e) => setOpen(false)}
        ></div>
      )}
      {open && (
        <div className="fixed z-20 h-80 w-80 overflow-scroll bg-violet-100">
          {opts.map((opt) => (
            <button
              className="m-1 block w-full cursor-pointer bg-white p-1 text-left hover:bg-violet-100"
              key={opt}
              onClick={onClick(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PRIndex() {
  const {
    // pulls,
    repos,
    selectedRepos: selectedReposFromUrl,
    ENV: { GITHUB_CLIENT_ID, GITHUB_TOKEN },
  } = useLoaderData<LoaderData>();

  const [selectedRepos, setSelectedRepos] = useState(selectedReposFromUrl);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const pullsFetcher = useFetcher();

  const removeRepo = (repo: PRByRepo) => {
    const repoString = `${repo.orgName}/${repo.repoName}`;
    const repos = selectedRepos.filter((r) => r !== repoString);
    setSelectedRepos(repos);
  };

  useEffect(() => {
    console.log("starting interval");

    setInterval(() => setLastRefresh(new Date()), 60000);
  }, []);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRefresh]);

  const formRef = useRef(null);

  const refetch = (form?: HTMLFormElement) => {
    if (!form && !formRef.current) return;
    pullsFetcher.submit(form || formRef.current);
  };

  // hax
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepos]);

  return (
    <main className="relative min-h-screen">
      <div className="relative m-2 flex-wrap items-center justify-between bg-white p-2 shadow sm:flex">
        <A
          href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${GITHUB_TOKEN}`}
        >
          Reauthenticate
        </A>
        <span suppressHydrationWarning>
          Last Refreshed: {lastRefresh.toLocaleString()}
        </span>
        <pullsFetcher.Form
          ref={formRef}
          method="get"
          action="/pulls"
          onChange={(event) => {
            console.log("changed222!");
          }}
        >
          <RepoSelector
            options={repos.map((repo) => repo.fullName)}
            selectedRepos={selectedRepos}
            setSelectedRepos={setSelectedRepos}
            refetch={refetch}
          />
          <input
            type="text"
            hidden
            name="selectedRepos"
            value={selectedRepos}
            onChange={(event) => {
              console.log("changed!");
              pullsFetcher.submit(event.target.form);
            }}
          />
        </pullsFetcher.Form>
      </div>
      {pullsFetcher.data &&
        pullsFetcher.data.pulls.map((repo) => (
          <div
            key={repo.repoName}
            className="relative m-2 flex-wrap p-2 sm:flex sm:items-center sm:justify-around"
          >
            <RepoCard repo={repo} removeRepo={removeRepo} />
          </div>
        ))}
    </main>
  );
}
