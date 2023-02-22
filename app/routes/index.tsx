import type { FetcherWithComponents } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { PullsByRepo, Pull } from "~/models/pr.server";
import React, { useEffect, useRef, useState } from "react";
import type { Repo } from "~/models/repo.server";
import { A, Link } from "~/components/buttons";

type LoaderData = {
  selectedRepos: Array<string>;
  ENV: {
    GITHUB_CLIENT_ID: string;
    GITHUB_TOKEN: string;
  };
};

export const loader = async ({ request }: { request: Request }) => {
  const selectedRepos = new URL(request.url).searchParams.getAll("repo");

  return json<LoaderData>({
    selectedRepos,
    ENV: {
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
    },
  });
};

const PRCard = ({ pull, pr }: { pull: PullsByRepo; pr: Pull }) => {
  return (
    <div
      key={`${pull.orgName} ${pull.repoName} ${pr.title}`}
      className={`h-13 m-2 flex-1 rounded-tl border-l-4 border-violet-400 bg-white p-2 text-sm shadow ${
        pr.reviewer ? "bg-violet-100" : ""
      }`}
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
  repo: PullsByRepo;
  removeRepo: (arg0: PullsByRepo) => void;
}) => {
  return (
    <>
      <div className="flex w-full justify-between">
        <div>
          <A className="text-lg" href={`https://github.com/${repo.orgName}`}>
            {repo.orgName}
          </A>{" "}
          /{" "}
          <A
            className="text-lg"
            href={`https://github.com/${repo.orgName}/${repo.repoName}`}
          >
            {repo.repoName}
          </A>
        </div>
        <button className="m-1" onClick={() => removeRepo(repo)}>
          ×
        </button>
      </div>
      {repo?.pulls?.length === 0 && "There are no open pulls for this repo"}
      {repo.pulls &&
        repo.pulls.map((pull) => (
          <PRCard
            key={`${repo.orgName}/${repo.repoName}/${pull.number}`}
            pr={pull}
            pull={repo}
          />
        ))}
    </>
  );
};

export function RepoSelector({
  selectedRepos,
  setSelectedRepos,
  reposFetcher,
}: {
  selectedRepos: Array<string>;
  setSelectedRepos: (arg0: string[]) => void;
  reposFetcher: FetcherWithComponents<{ repos: Repo[] }>;
}) {
  const [filterText, setFilterText] = useState<string>("");
  const [open, setOpen] = useState(false);
  const options = (
    reposFetcher.data?.repos || [{ fullName: "loading..." }]
  ).map((repo) => repo.fullName);

  const opts = options
    .filter((opt) =>
      filterText ? opt.toUpperCase().includes(filterText.toUpperCase()) : true
    )
    .filter((opt) =>
      selectedRepos.length ? !selectedRepos.includes(opt) : true
    );

  const onClick = (opt: string) => () => {
    setOpen(false);
    const newSelectedRepos = [...selectedRepos, opt];
    setSelectedRepos(newSelectedRepos);

    const path = newSelectedRepos.reduce(
      (newPath, repo) => `${newPath}repo=${repo}&`,
      "?"
    );
    history.pushState({}, "", path);
  };

  const reposFormRef = useRef(null);

  // runs once on startup
  useEffect(() => {
    if (!reposFormRef.current) return;

    try {
      reposFetcher.submit(reposFormRef.current);
    } catch (e) {
      console.warn("unable to fetch at this time", e);
    }
  }, []);

  return (
    <reposFetcher.Form ref={reposFormRef} method="get" action="/repos">
      <div>
        Select repos to view:
        <input
          className="w-full border-2 border-violet-400 px-1 shadow"
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
    </reposFetcher.Form>
  );
}

const SideBar = ({
  lastRefresh,
  selectedRepos,
  setSelectedRepos,
}: {
  lastRefresh: Date;
  selectedRepos: Array<string>;
  setSelectedRepos: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const reposFetcher = useFetcher();
  const {
    ENV: { GITHUB_CLIENT_ID, GITHUB_TOKEN },
  } = useLoaderData<LoaderData>();

  return (
    <nav
      id="nav-bar"
      className={`flex cursor-pointer flex-col border-zinc-400 bg-white p-4 shadow-md transition-all hover:border-r-4 hover:bg-zinc-100`}
      style={{ width: sidebarOpen ? "240px" : "60px" }}
      onClick={(event) => {
        if ((event.target as HTMLElement)?.id === "nav-bar")
          setSidebarOpen(!sidebarOpen);
      }}
    >
      <h1
        className="font-bold"
        style={{ writingMode: sidebarOpen ? "initial" : "vertical-lr" }}
      >
        PR Viewer
      </h1>
      <p
        suppressHydrationWarning
        className="my-3"
        style={{ writingMode: sidebarOpen ? "initial" : "vertical-lr" }}
      >
        Last Refreshed: {lastRefresh.toLocaleString()}
      </p>

      {sidebarOpen && (
        <>
          <hr className="mb-6" />
          <Link
            className="mb-4"
            href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${GITHUB_TOKEN}`}
          >
            Login with GitHub
          </Link>

          <RepoSelector
            selectedRepos={selectedRepos}
            setSelectedRepos={setSelectedRepos}
            reposFetcher={reposFetcher}
          />
        </>
      )}
    </nav>
  );
};

const Pulls = ({
  pullsData,
  removeRepo,
}: {
  pullsData: PullsByRepo[];
  removeRepo: (repo: PullsByRepo) => void;
}) => (
  <div className="flex w-full flex-col items-center">
    {pullsData && pullsData.length ? (
      pullsData.map((repo) => (
        <div
          key={repo.repoName}
          className="relative m-2 w-full max-w-6xl flex-wrap p-2 sm:flex sm:items-center sm:justify-around"
        >
          <RepoCard repo={repo} removeRepo={removeRepo} />
        </div>
      ))
    ) : (
      <p className="mt-10 text-lg">
        Pull Requests will be visible here once chosen from the sidebar
      </p>
    )}
  </div>
);

const PullsFetcher = ({
  formRef,
  selectedRepos,
  pullsFetcher,
}: {
  formRef: React.MutableRefObject<null>;
  selectedRepos: string[];
  pullsFetcher: FetcherWithComponents<PullsByRepo[]>;
}) => (
  <pullsFetcher.Form ref={formRef} method="get" action="/pulls">
    <input
      type="text"
      hidden
      name="selectedRepos"
      value={selectedRepos}
      onChange={(event) => {
        pullsFetcher.submit(event.target.form);
      }}
    />
  </pullsFetcher.Form>
);

export default function PRIndex() {
  const { selectedRepos: selectedReposFromUrl } = useLoaderData<LoaderData>();

  const formRef = useRef(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedRepos, setSelectedRepos] = useState(selectedReposFromUrl);
  const pullsFetcher = useFetcher<PullsByRepo[]>();
  const pullsData: PullsByRepo[] = pullsFetcher.data || [];

  useEffect(() => {
    setInterval(() => setLastRefresh(new Date()), 2000);
  }, []);

  useEffect(() => refetch(), [selectedRepos, lastRefresh]);

  const refetch = (form?: HTMLFormElement) => {
    if (!selectedRepos.length) return;
    if (!form && !formRef.current) return;

    try {
      pullsFetcher.submit(form || formRef.current);
    } catch (e) {
      console.warn("unable to fetch at this time", e);
    }
  };

  const removeRepo = (repo: PullsByRepo) => {
    const repoString = `${repo.orgName}/${repo.repoName}`;
    const repos = selectedRepos.filter((r) => r !== repoString);
    setSelectedRepos(repos);
  };

  return (
    <main className="relative flex min-h-screen flex-row">
      <PullsFetcher {...{ selectedRepos, pullsFetcher, formRef }} />
      <SideBar
        {...{ lastRefresh, pullsFetcher, selectedRepos, setSelectedRepos }}
      />
      <Pulls {...{ pullsData, removeRepo }} />
    </main>
  );
}
