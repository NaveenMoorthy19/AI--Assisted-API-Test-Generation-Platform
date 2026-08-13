"use client";

import { useState } from "react";
export type PipelineStatusValue =
  "running" | "completed" | "failed";

export interface PipelineStages {
  requirements: "pending" | "completed";
  tickets: "pending" | "completed";
  acceptance_criteria: "pending" | "completed";
  test_cases: "pending" | "completed";
  git: "pending" | "completed";
}

export interface PipelineStateResponse {
  job_id: string;
  status: PipelineStatusValue;

  requirements: unknown[];
  completed_ac: unknown[];
  completed_tests: unknown[];

  git_result: {
    repo: string;
    commit_url: string | null;
  } | null;

  error: string | null;
  progress: number;
}

export interface StatusResponse {
  job_id: string;
  status: PipelineStatusValue;
  progress: number;
  data: PipelineStateResponse | null;
  stages: PipelineStages;
  error: string | null;
}

// // export type PipelineStatusValue = "running" | "completed" | "failed";

// // export interface PipelineStages {
// //   requirements: "pending" | "completed";
// //   tickets: "pending" | "completed";
// //   acceptance_criteria: "pending" | "completed";
// //   test_cases: "pending" | "completed";
// //   git: "pending" | "completed";
// // }

// export interface PipelineStateResponse {
//   // job_id: string;
//   // status: PipelineStatusValue;

//   // requirements: unknown[];
//   // completed_ac: unknown[];
//   // completed_tests: unknown[];

//   // git_result: {
//   //   repo: string;
//   //   commit_url: string | null;
//   // } | null;

//   // error: string | null;
//   // progress: number;

//   // stages: {
//   //   requirements: "pending" | "completed";
//   //   tickets: "pending" | "completed";
//   //   acceptance_criteria: "pending" | "completed";
//   //   test_cases: "pending" | "completed";
//   //   git: "pending" | "completed";
//   // };
//     job_id: string;
//   status: PipelineStatusValue;

//   requirements: unknown[];
//   completed_ac: unknown[];
//   completed_tests: unknown[];

//   git_result: {
//     repo: string;
//     commit_url: string | null;
//   } | null;

//   error: string | null;
//   progress: number;
// }

// export interface StatusResponse {
//   // job_id: string;
//   // status: PipelineStatusValue;
//   // progress: number;
//   // data: PipelineStateResponse | null;
//   // error: string | null;
//     job_id: string;
//   status: PipelineStatusValue;
//   progress: number;
//   data: PipelineStateResponse | null;
//   stages: PipelineStages;
//   error: string | null;
// }

export type ResultTab = "requirements" | "acceptance" | "testcases" | "git";

export const RESULT_TABS: {
  key: ResultTab;
  label: string;
  dataKey: keyof PipelineStateResponse;
}[] = [
  { key: "requirements", label: "Requirements", dataKey: "requirements" },
  { key: "acceptance", label: "Acceptance Criteria", dataKey: "completed_ac" },
  { key: "testcases", label: "Test Cases", dataKey: "completed_tests" },
  { key: "git", label: "Git", dataKey: "git_result" },
];

// Renders a single unknown item as formatted JSON or plain string
export function PipelineItem({ index, item }: { index: number; item: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const isObj = typeof item === "object" && item !== null;
  const preview = isObj
    ? (item as Record<string, unknown>).title ??
      (item as Record<string, unknown>).name ??
      (item as Record<string, unknown>).id ??
      `Item ${index + 1}`
    : String(item).slice(0, 80);

  return (
    <div className={`pi-card ${expanded ? "pi-expanded" : ""}`}>
      <button className="pi-header" onClick={() => setExpanded((v) => !v)}>
        <span className="pi-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="pi-preview">{String(preview)}</span>
        <span className="pi-chevron">{expanded ? "▴" : "▾"}</span>
      </button>
      {expanded && (
        <pre className="pi-body">{isObj ? JSON.stringify(item, null, 2) : String(item)}</pre>
      )}
    </div>
  );
}

export function GitPanel({
  result,
}: {
  result: { repo: string; commit_url: string | null } | null;
}) {
  if (!result) {
    return <div className="empty-state">No git result available.</div>;
  }
  return (
    <div className="git-panel">
      <div className="git-row">
        <span className="git-label">Repository</span>
        <span className="git-value">{result.repo}</span>
      </div>
      <div className="git-row">
        <span className="git-label">Commit URL</span>
        {result.commit_url ? (
          <a
            href={result.commit_url}
            target="_blank"
            rel="noopener noreferrer"
            className="git-link"
          >
            {result.commit_url} ↗
          </a>
        ) : (
          <span className="git-value git-muted">not available</span>
        )}
      </div>
      <div className="git-badge">
        <span className="git-dot" />
        Pushed successfully
      </div>
    </div>
  );
}

/**
 * Full tab bar + tab content block. Used on the /results/[jobId] page,
 * and reusable later for /jobs/[jobId]/tickets/[ticketId].
 */
export function ResultsTabs({
  pipelineData,
  activeTab,
  setActiveTab,
}: {
  pipelineData: PipelineStateResponse | null;
  activeTab: ResultTab;
  setActiveTab: (tab: ResultTab) => void;
}) {
  const getTabItems = (tab: ResultTab): unknown[] | null => {
    if (!pipelineData) return null;
    switch (tab) {
      case "requirements":
        return pipelineData.requirements;
      case "acceptance":
        return pipelineData.completed_ac;
      case "testcases":
        return pipelineData.completed_tests;
      default:
        return null;
    }
  };

  return (
    <div className="pipeline-detail">
      <div className="tab-bar" role="tablist">
        {RESULT_TABS.map((tab) => {
          const count =
            tab.key === "git"
              ? pipelineData?.git_result
                ? 1
                : 0
              : ((pipelineData?.[tab.dataKey] as unknown[])?.length ?? 0);
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`tab-btn ${activeTab === tab.key ? "tab-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="tab-content" role="tabpanel">
        {activeTab === "git" ? (
          <GitPanel result={pipelineData?.git_result ?? null} />
        ) : (
          (() => {
            const items = getTabItems(activeTab);
            if (!items || items.length === 0) {
              return <div className="empty-state">No data available for this stage.</div>;
            }
            return (
              <div className="items-list">
                {items.map((item, i) => (
                  <PipelineItem key={i} index={i} item={item} />
                ))}
              </div>
            );
          })()
        )}
      </div>

      <style jsx global>{`
        .pipeline-detail {
          border: 1px solid #232732;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
        }
        .tab-bar {
          display: flex;
          border-bottom: 1px solid #1d212b;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tab-bar::-webkit-scrollbar { display: none; }
        .tab-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #5a6478;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
        }
        .tab-btn:hover { color: #c4cad6; }
        .tab-active { color: #fb851e  !important; border-bottom-color: #fb851e !important; }
        .tab-count {
          font-family: 'Consolas', 'SF Mono', monospace;
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 20px;
          background: #fb851e;
          color: black;
        }
        .tab-active .tab-count { background: #fff; color: #fb851e; }
        .tab-content {
          padding: 16px;
          max-height: 60vh;
          overflow-y: auto;
        }
        .items-list { display: flex; flex-direction: column; gap: 8px; }
        .pi-card {
          border: 1px solid #1d212b;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }
        .pi-card:hover, .pi-expanded { border-color: #2b3140; }
        .pi-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
        }
        .pi-header:hover { background: rgba(255,255,255,0.02); }
        .pi-index { font-family: 'Consolas', 'SF Mono', monospace; font-size: 11px; color: #4a5266; flex-shrink: 0; }
        .pi-preview { font-size: 13px; color: #fb851e; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pi-chevron { font-size: 11px; color: #4a5266; flex-shrink: 0; }
        .pi-body {
          margin: 0;
          padding: 12px 14px;
          font-family: 'Consolas', 'SF Mono', monospace;
          font-size: 12px;
          color: black;
          background: #FFB347;
          border-top: 1px solid #1d212b;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.6;
        }
        .git-panel { display: flex; flex-direction: column; gap: 12px; }
        .git-row { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid #1d212b; border-radius: 8px; }
        .git-label { font-family: 'Consolas', 'SF Mono', monospace; font-size: 10px; color: black; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 400 }
        .git-value { font-size: 13px; color: #fb851e; word-break: break-all; }
        .git-muted { color: #4a5266; }
        .git-link { font-size: 13px; color: #fb851e; text-decoration: none; word-break: break-all; }
        .git-link:hover { text-decoration: underline; }
        .git-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          background: rgba(74, 222, 128, 0.06);
          border: 1px solid rgba(74, 222, 128, 0.2);
          border-radius: 8px;
          font-size: 13px;
          color: #4ade80;
          font-weight: 500;
          width: fit-content;
        }
        .git-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }
        .empty-state {
          padding: 32px;
          text-align: center;
          font-family: 'Consolas', 'SF Mono', monospace;
          font-size: 12px;
          color: #4a5266;
        }
      `}</style>
    </div>
  );
}
