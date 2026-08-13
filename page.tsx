// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import api from "@/services/api";
// import {
//   PipelineStateResponse,
//   PipelineStages,
//   StatusResponse,
//   ResultTab,
//   ResultsTabs,
// } from "@/components/PipelineResults";

// const POLL_INTERVAL_MS = 2000;
// const MAX_POLL_ATTEMPTS = 600;

// export default function ResultsPage() {
//   const params = useParams<{ jobid: string }>();
//   const router = useRouter();
//   const jobId = params.jobid;

//   const [pipelineData, setPipelineData] = useState<PipelineStateResponse | null>(null);
//   const [stages, setStages] = useState<PipelineStages | null>(null);
//   const [status, setStatus] = useState<"loading" | "running" | "completed" | "failed">("loading");
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState<ResultTab>("requirements");

//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const inFlightRef = useRef(false);
//   const attemptsRef = useRef(0);

//   useEffect(() => {
//     if (!jobId) return;

//     const fetchStatus = async () => {
//       if (inFlightRef.current) return;
//       attemptsRef.current += 1;

//       if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
//         if (intervalRef.current) clearInterval(intervalRef.current);
//         setStatus("failed");
//         setErrorMessage("Timed out waiting for pipeline status.");
//         return;
//       }

//       inFlightRef.current = true;
//       try {
//         // const response = await api.get<StatusResponse>(`/status/${jobId}`);
//         const response = await api.get<StatusResponse>(
//           `/status/${jobId}`
//         );

//         console.log("PIPELINE STATUS:", response.data);

//         if (response.data.data) {
//           setPipelineData(response.data.data);
//         }

//         if (response.data.stages) {
//           setStages(response.data.stages);
//         }
//         if (response.data.data) setPipelineData(response.data.data);

//         if (response.data.status === "completed") {
//           if (intervalRef.current) clearInterval(intervalRef.current);
//           setStatus("completed");
//         } else if (response.data.status === "failed") {
//           if (intervalRef.current) clearInterval(intervalRef.current);
//           setStatus("failed");
//           setErrorMessage(response.data.error ?? "Pipeline failed.");
//         } else {
//           setStatus("running");
//         }
//       } catch (err) {
//         console.error(err);
//         if (intervalRef.current) clearInterval(intervalRef.current);
//         setStatus("failed");
//         setErrorMessage("Unable to fetch pipeline status for this job.");
//       } finally {
//         inFlightRef.current = false;
//       }
//     };

//     fetchStatus();
//     intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);

//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, [jobId]);

//   return (
//     <main className="results-shell">
//       <div className="results-container">
//         <div className="results-header">
//           <button className="back-link" onClick={() => router.push("/")}>
//             ← Back
//           </button>
//           <span className="job-id">Job {jobId}</span>
//         </div>

//         {status === "loading" && <div className="status-msg">Loading job…</div>}

//         {status === "running" && (
//           <div className="status-msg status-running">
//             Pipeline still running — this page will update automatically.
//           </div>
//         )}

//         {status === "failed" && (
//           <div className="status-msg status-failed">{errorMessage ?? "Pipeline failed."}</div>
//         )}

//         {pipelineData && <ResultsTabs pipelineData={pipelineData} activeTab={activeTab} setActiveTab={setActiveTab} />}
//       </div>

//       <style jsx>{`
//         .results-shell {
//           min-height: 100vh;
//           background: #fff;
//           color: #e8eaed;
//           font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
//           padding: 32px 20px;
//           display: flex;
//           justify-content: center;
//         }
//         .results-container {
//           width: 100%;
//           max-width: 820px;
//         }
//         .results-header {
//           display: flex;
//           align-items: center;
//           gap: 14px;
//           margin-bottom: 20px;
//         }
//         .back-link {
//           background: transparent;
//           border: 1px solid #232732;
//          color: #fb851e;
//           font-size: 13px;
//           padding: 7px 12px;
//           border-radius: 8px;
//           cursor: pointer;
//         }
//         .back-link:hover { border-color: #2b3140; color: #5eead4; }
//         .job-id {
//           font-family: 'Consolas', 'SF Mono', monospace;
//           font-size: 12px;
//           color: black;
//         }
//         .status-msg {
//           padding: 24px;
//           text-align: center;
//           font-size: 14px;
//           color: #8d96a8;
//           border: 1px solid #232732;
//           border-radius: 12px;
//           margin-bottom: 16px;
//         }
//         .status-running { color: #f5b544; }
//         .status-failed { color: #f87171; }
//       `}</style>
//     </main>
//   );
// }

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";

import {
  PipelineStateResponse,
  PipelineStages,
  StatusResponse,
  ResultTab,
  ResultsTabs,
} from "@/components/PipelineResults";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 150;

function PipelineStage({
  label,
  stageStatus,
}: {
  label: string;
  stageStatus: "pending" | "completed";
}) {
  const completed = stageStatus === "completed";

  return (
    <div className="pipeline-stage">
      <span
        className={`stage-icon ${
          completed ? "stage-completed" : "stage-pending"
        }`}
      >
        {completed ? "✓" : "○"}
      </span>

      <span className="stage-label">
        {label}
      </span>

      <span
        className={`stage-status ${
          completed
            ? "status-completed"
            : "status-pending"
        }`}
      >
        {completed ? "Completed" : "Pending"}
      </span>
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams<{ jobid: string }>();
  const router = useRouter();
  const jobId = params.jobid;

  const [pipelineData, setPipelineData] =
    useState<PipelineStateResponse | null>(null);

  const [stages, setStages] =
    useState<PipelineStages | null>(null);

  const [status, setStatus] = useState<
    "loading" | "running" | "completed" | "failed"
  >("loading");

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<ResultTab>("requirements");

  const intervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const inFlightRef = useRef(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!jobId) return;

    const fetchStatus = async () => {
      if (inFlightRef.current) return;

      attemptsRef.current += 1;

      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        setStatus("failed");
        setErrorMessage(
          "Timed out waiting for pipeline status."
        );

        return;
      }

      inFlightRef.current = true;

      try {
        const response =
          await api.get<StatusResponse>(
            `/status/${jobId}`
          );

        console.log(
          "PIPELINE STATUS:",
          response.data
        );

        // -----------------------------
        // Update pipeline data
        // -----------------------------
        if (response.data.data) {
          setPipelineData(
            response.data.data
          );
        }

        // -----------------------------
        // Update stage status
        // -----------------------------
        if (response.data.stages) {
          setStages(
            response.data.stages
          );
        }

        // -----------------------------
        // Update overall status
        // -----------------------------
        if (
          response.data.status ===
          "completed"
        ) {
          if (intervalRef.current) {
            clearInterval(
              intervalRef.current
            );
          }

          setStatus("completed");
        }

        else if (
          response.data.status ===
          "failed"
        ) {
          if (intervalRef.current) {
            clearInterval(
              intervalRef.current
            );
          }

          setStatus("failed");

          setErrorMessage(
            response.data.error ??
            "Pipeline failed."
          );
        }

        else {
          setStatus("running");
        }

      } catch (err) {
        console.error(
          "Status API error:",
          err
        );

        if (intervalRef.current) {
          clearInterval(
            intervalRef.current
          );
        }

        setStatus("failed");

        setErrorMessage(
          "Unable to fetch pipeline status for this job."
        );
      }

      finally {
        inFlightRef.current = false;
      }
    };

    // First request immediately
    fetchStatus();

    // Poll every 2 seconds
    intervalRef.current =
      setInterval(
        fetchStatus,
        POLL_INTERVAL_MS
      );

    return () => {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        );
      }
    };

  }, [jobId]);

  return (
    <main className="results-shell">

      <div className="results-container">

        {/* Header */}
        <div className="results-header">

          <button
            className="back-link"
            onClick={() => router.push("/")}
          >
            ← Back
          </button>

          <span className="job-id">
            Job {jobId}
          </span>

        </div>


        {/* Loading */}
        {status === "loading" && (
          <div className="status-msg">
            Loading job…
          </div>
        )}


        {/* Running */}
        {status === "running" && (
          <div className="status-msg status-running">
            Pipeline still running —
            this page will update automatically.
          </div>
        )}


        {/* Pipeline stages */}
        {/* {stages && (
          <div className="pipeline-progress">

            <PipelineStage
              label="Requirements"
              stageStatus={
                stages.requirements
              }
            />

            <PipelineStage
              label="Tickets"
              stageStatus={
                stages.tickets
              }
            />

            <PipelineStage
              label="Acceptance Criteria"
              stageStatus={
                stages.acceptance_criteria
              }
            />

            <PipelineStage
              label="Test Cases"
              stageStatus={
                stages.test_cases
              }
            />

            <PipelineStage
              label="Git"
              stageStatus={
                stages.git
              }
            />

          </div>
        )} */}


        {/* Failed */}
        {status === "failed" && (
          <div className="status-msg status-failed">
            {errorMessage ??
              "Pipeline failed."}
          </div>
        )}


        {/* Results */}
        {pipelineData && (
          <ResultsTabs
            pipelineData={pipelineData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

      </div>


      <style jsx>{`

        .results-shell {
          min-height: 100vh;
          background: #fff;
          color: #e8eaed;
          font-family:
            'Segoe UI',
            system-ui,
            -apple-system,
            sans-serif;
          padding: 32px 20px;
          display: flex;
          justify-content: center;
        }

        .results-container {
          width: 100%;
          max-width: 820px;
        }

        .results-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }

        .back-link {
          background: transparent;
          border: 1px solid #232732;
          color: #fb851e;
          font-size: 13px;
          padding: 7px 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .back-link:hover {
          border-color: #2b3140;
          color: #5eead4;
        }

        .job-id {
          font-family:
            'Consolas',
            'SF Mono',
            monospace;
          font-size: 12px;
          color: black;
        }

        .status-msg {
          padding: 24px;
          text-align: center;
          font-size: 14px;
          color: #8d96a8;
          border: 1px solid #232732;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .status-running {
          color: #f5b544;
        }

        .status-failed {
          color: #f87171;
        }

        /* =========================
           PIPELINE PROGRESS
        ========================= */

        .pipeline-progress {
          border: 1px solid #232732;
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
          background: #fff;
        }

        .pipeline-stage {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 4px;
          border-bottom: 1px solid #eeeeee;
        }

        .pipeline-stage:last-child {
          border-bottom: none;
        }

        .stage-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .stage-completed {
          background: #4ade80;
          color: white;
        }

        .stage-pending {
          background: #eeeeee;
          color: #888;
        }

        .stage-label {
          flex: 1;
          font-size: 14px;
          color: #222;
        }

        .stage-status {
          font-size: 12px;
          font-weight: 500;
        }

        .status-completed {
          color: #16a34a;
        }

        .status-pending {
          color: #888;
        }

      `}</style>

    </main>
  );
}
