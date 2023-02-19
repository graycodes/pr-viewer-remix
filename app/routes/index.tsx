import type { FetcherWithComponents } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { PullsByOrgRepo, Pull } from "~/models/pr.server";

import { cookieAccessToken, cookieUsername } from "~/cookie";
import type { Repo } from "~/models/repo.server";
import { getRepos } from "~/models/repo.server";
import React, { FormEvent, useEffect, useRef, useState } from "react";

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
  // const username = await cookieUsername.parse(cookies);
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

const PRCard = ({ pull, pr }: { pull: PullsByOrgRepo; pr: Pull }) => {
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
  repo: PullsByOrgRepo;
  removeRepo: (arg0: PullsByOrgRepo) => void;
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

const buttonStyles =
  "bg-violet-400 p-[2px] px-2 text-white text-center shadow hover:bg-violet-300";

const Link = (props) => (
  <a {...props} className={buttonStyles + " " + props.className} />
);
const Button = (props) => (
  <button {...props} className={buttonStyles + " " + props.className} />
);

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
    <>
      <div>
        <input
          className="border-2 border-violet-400 px-1 shadow w-full"
          placeholder="Search repos..."
          type={"text"}
          value={filterText}
          onFocus={(e) => setOpen(true)}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <Button className=" w-full" onClick={clickGo}>Save Params In URL</Button>
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
    </>
  );
}

const SideBar = ({
  sidebarOpen,
  setSidebarOpen,
  lastRefresh,
  pullsFetcher,
  GITHUB_CLIENT_ID,
  GITHUB_TOKEN,
  formRef,
  repos,
  selectedRepos,
  setSelectedRepos,
  refetch,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lastRefresh: Date;
  pullsFetcher: FetcherWithComponents<any>;
  GITHUB_CLIENT_ID: string;
  GITHUB_TOKEN: string;
  formRef: React.MutableRefObject<null>;
  repos: Array<Repo>;
  selectedRepos: Array<string>;
  setSelectedRepos: React.Dispatch<React.SetStateAction<string[]>>;
  refetch: (form?: HTMLFormElement) => void;
}) => {
  return (
    <nav
      id="nav-bar"
      className={`flex cursor-pointer flex-col bg-white p-4 shadow-md transition-all hover:bg-zinc-100 hover:border-r-4 border-zinc-400`}
      style={{ width: sidebarOpen ? "240px" : "60px" }}
      onClick={(event) => {
        if (event?.target?.id === 'nav-bar') setSidebarOpen(!sidebarOpen)
      }}
    >

        <h1 className="font-bold" style={{ writingMode: sidebarOpen ? 'initial' : "vertical-lr" }}>
          PR Viewer
        </h1>
          <p suppressHydrationWarning className="my-3" style={{ writingMode: sidebarOpen ? 'initial' : "vertical-lr" }}>
            Last Refreshed: {lastRefresh.toLocaleString()}
          </p>

      {sidebarOpen && (
        <>
          <hr className="mb-6" />
          <Link
            className="mb-4"
            href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${GITHUB_TOKEN}`}
          >
            Reauthenticate
          </Link>
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
        </>
      )}
    </nav>
  );
};

export default function PRIndex() {
  const {
    // pulls,
    repos,
    selectedRepos: selectedReposFromUrl,
    ENV: { GITHUB_CLIENT_ID, GITHUB_TOKEN },
  } =
    useLoaderData<LoaderData>();
    // {
    //   repos: [],
    //   selectedRepos: [],
    //   ENV: { GITHUB_CLIENT_ID: "", GITHUB_TOKEN: "" },
    // };

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedRepos, setSelectedRepos] = useState(selectedReposFromUrl);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pullsFetcher = useFetcher();

  const removeRepo = (repo: PullsByOrgRepo) => {
    const repoString = `${repo.orgName}/${repo.repoName}`;
    const repos = selectedRepos.filter((r) => r !== repoString);
    setSelectedRepos(repos);
  };

  useEffect(() => {
    setInterval(() => setLastRefresh(new Date()), 60000);
  }, []);

  useEffect(() => {
    try {
      refetch();
    } catch (e) {
      console.warn("unable to fetch this time, sorry");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRefresh]);

  const formRef = useRef(null);

  const refetch = (form?: HTMLFormElement) => {
    if (!form && !formRef.current) return;
    try {
      pullsFetcher.submit(form || formRef.current);
    } catch (e) {
      console.warn('unable to fetch at this time')
    }
  };

  // hax
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepos]);

  return (
    <main className="relative flex min-h-screen flex-row">
      <SideBar
        {...{
          sidebarOpen,
          setSidebarOpen,
          lastRefresh,
          pullsFetcher,
          GITHUB_CLIENT_ID,
          GITHUB_TOKEN,
          formRef,
          repos,
          selectedRepos,
          setSelectedRepos,
          refetch,
        }}
      />
      <div className="flex flex-col w-full items-center">
      {pullsFetcher.data &&
        pullsFetcher.data.pulls.map((repo) => (
          <div
            key={repo.repoName}
            className="relative m-2 flex-wrap max-w-6xl w-full p-2 sm:flex sm:items-center sm:justify-around"
          >
            <RepoCard repo={repo} removeRepo={removeRepo} />
          </div>
        ))}
        </div>
    </main>
  );
}
