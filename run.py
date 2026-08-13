import os
import operator
from typing import Annotated, TypedDict

from config import settings
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from langchain_core.runnables import RunnableConfig

# Import your state models
from agents.state import BRDWorkflowState

# Import your nodes
from agents.nodes.requirementnode import requirement_node
from agents.nodes.ticketnode import ticket_node
from agents.nodes.acnode import ac_node
from agents.nodes.testcasenode import testcase_node


# Load environment variables
load_dotenv()


# ============================================================
# EDGE ROUTING FUNCTIONS
# ============================================================

def assign_ac_workers(state: BRDWorkflowState):
    print("ROUTING: Assigning parallel AC workers...")

    # Send each requirement to a parallel AC worker
    return [
        Send(
            "ac_node",
            {
                "requirement": req
            }
        )
        for req in state.get("requirements", [])
    ]


def assign_test_workers(state: BRDWorkflowState):
    print("ROUTING: Assigning parallel Test Case workers...")

    sends = []

    for ac in state.get("completed_ac", []):

        # Match AC back to original requirement
        req = next(
            (
                r
                for r in state["requirements"]
                if r.id == ac.req_id
            ),
            None
        )

        if req:
            sends.append(
                Send(
                    "testcase_node",
                    {
                        "requirement": req,
                        "acceptance_criteria": ac
                    }
                )
            )

    return sends


def synthesize_ac(state: BRDWorkflowState):
    """
    This node runs after all AC workers have completed.
    It simply allows the graph to move to Test Case generation.
    """

    print(
        "ROUTING: AC generation complete. "
        "Moving to Test Case generation..."
    )

    return {}


# ============================================================
# FINALIZE GIT
# ============================================================

def finalize_git(state: BRDWorkflowState):

    print("FINALIZING GIT RESULT")

    tests = state.get("completed_tests", [])

    pushed = [
        t
        for t in tests
        if t.get("git_pushed")
    ]

    if not pushed:
        return {
            "git_result": None
        }

    last = pushed[-1]

    return {
        "git_result": {
            "repo": (
                f"{settings.GIT_REPO_OWNER}/"
                f"{settings.GIT_REPO_NAME}"
            ),
            "commit_url": last.get("git_commit_url")
        }
    }


# ============================================================
# BUILD GRAPH
# ============================================================

def build_graph():

    graph = StateGraph(BRDWorkflowState)

    # --------------------------------------------------------
    # Add Nodes
    # --------------------------------------------------------

    graph.add_node(
        "requirement_node",
        requirement_node
    )

    graph.add_node(
        "ticket_node",
        ticket_node
    )

    graph.add_node(
        "ac_node",
        ac_node
    )

    graph.add_node(
        "synthesize_ac",
        synthesize_ac
    )

    graph.add_node(
        "testcase_node",
        testcase_node
    )

    graph.add_node(
        "finalize_git",
        finalize_git
    )

    # --------------------------------------------------------
    # Main Flow
    # --------------------------------------------------------

    graph.add_edge(
        START,
        "requirement_node"
    )

    graph.add_edge(
        "requirement_node",
        "ticket_node"
    )

    # --------------------------------------------------------
    # Ticket → Parallel AC Workers
    # --------------------------------------------------------

    graph.add_conditional_edges(
        "ticket_node",
        assign_ac_workers,
        ["ac_node"]
    )

    # --------------------------------------------------------
    # AC Workers → Synthesize AC
    # --------------------------------------------------------

    graph.add_edge(
        "ac_node",
        "synthesize_ac"
    )

    # --------------------------------------------------------
    # Synthesize AC → Parallel Test Case Workers
    # --------------------------------------------------------

    graph.add_conditional_edges(
        "synthesize_ac",
        assign_test_workers,
        ["testcase_node"]
    )

    # --------------------------------------------------------
    # Test Cases → Git Finalization
    # --------------------------------------------------------

    graph.add_edge(
        "testcase_node",
        "finalize_git"
    )

    graph.add_edge(
        "finalize_git",
        END
    )

    return graph.compile()


# ============================================================
# NORMAL PIPELINE EXECUTION
# ============================================================

def execute_pipeline(brd_content: str):

    app = build_graph()

    initial_state = {
        "content": brd_content,
        "brd_id": "MOCK-BRD-001"
    }

    config = RunnableConfig(
        max_concurrency=2
    )

    final_state = app.invoke(
        initial_state,
        config=config
    )

    print(final_state)

    return final_state


# ============================================================
# STREAMING PIPELINE EXECUTION
# ============================================================

def execute_pipeline_streaming(
    brd_content: str,
    job_id: str,
    jobs: dict
):

    print(
        f"STARTING STREAMING PIPELINE "
        f"FOR JOB: {job_id}"
    )

    app = build_graph()

    initial_state = {
        "content": brd_content,
        "brd_id": "MOCK-BRD-001"
    }

    config = RunnableConfig(
        max_concurrency=2
    )

    accumulated_state = dict(
        initial_state
    )

    # ========================================================
    # IMPORTANT:
    # Initialize stage tracking.
    #
    # This solves the problem where jobs[job_id]["stages"]
    # does not exist.
    # ========================================================

    if job_id not in jobs:

        jobs[job_id] = {
            "status": "running",
            "progress": 0,
             "data": {},
            "stages": {
                "requirements": "pending",
                "acceptance_criteria": "pending",
                "test_cases": "pending",
                "test_scripts": "pending",
                "git": "pending"
                },
            "error": None
            }
        
    jobs[job_id].setdefault("status", "running")
    jobs[job_id].setdefault("progress", 0)
    jobs[job_id].setdefault("data", {})
    jobs[job_id].setdefault("error", None)
        
    jobs[job_id].setdefault("stages", {})
    jobs[job_id]["stages"].setdefault("requirements","pending")

    jobs[job_id]["stages"].setdefault("acceptance_criteria","pending")
    jobs[job_id]["stages"].setdefault("test_cases","pending")
    jobs[job_id]["stages"].setdefault("test_scripts","pending")
    jobs[job_id]["stages"].setdefault("git","pending")
    # ========================================================
    # Progress percentages
    # ========================================================

    stage_progress = {

        "requirement_node": 20,

        "ticket_node": 35,

        # AC worker itself is parallel.
        # Final AC completion is marked at synthesize_ac.
        "ac_node": 50,

        "synthesize_ac": 60,

        "testcase_node": 85,

        "finalize_git": 100
    }

    # ========================================================
    # STREAM LANGGRAPH
    # ========================================================

    try:

        for step in app.stream(
            initial_state,
            config=config
        ):

            for node_name, node_output in step.items():

                if node_output is None:
                    continue

                print(
                    f"NODE COMPLETED: {node_name}"
                )

                # ------------------------------------------------
                # Accumulate State
                # ------------------------------------------------

                for key, value in node_output.items():

                    if (
                        isinstance(value, list)
                        and isinstance(
                            accumulated_state.get(key),
                            list
                        )
                    ):

                        accumulated_state[key] = (
                            accumulated_state.get(key, [])
                            + value
                        )

                    else:

                        accumulated_state[key] = value

                # ------------------------------------------------
                # UPDATE INDIVIDUAL STAGE STATUS
                # ------------------------------------------------

                if node_name == "requirement_node":

                    jobs[job_id]["stages"][
                        "requirements"
                    ] = "completed"

                elif node_name == "ticket_node":

                    jobs[job_id]["stages"][
                        "test_scripts"
                    ] = "completed"

                elif node_name == "synthesize_ac":

                    # This node runs after all AC workers
                    # have joined.
                    jobs[job_id]["stages"][
                        "acceptance_criteria"
                    ] = "completed"

                elif node_name == "testcase_node":

                    jobs[job_id]["stages"][
                        "test_cases"
                    ] = "completed"

                elif node_name == "finalize_git":

                    jobs[job_id]["stages"][
                        "git"
                    ] = "completed"

                # ------------------------------------------------
                # UPDATE PROGRESS
                # ------------------------------------------------

                progress = stage_progress.get(
                    node_name,
                    jobs[job_id]["progress"]
                )

                jobs[job_id]["data"] = (
                    accumulated_state
                )

                jobs[job_id]["progress"] = (
                    progress
                )

                # ------------------------------------------------
                # PRINT CURRENT STATUS
                # ------------------------------------------------

                print(
                    "----------------------------------------"
                )

                print(
                    f"STREAM UPDATE"
                )

                print(
                    f"Node     : {node_name}"
                )

                print(
                    f"Progress : {progress}%"
                )

                print(
                    f"Stages   : "
                    f"{jobs[job_id]['stages']}"
                )

                print(
                    "----------------------------------------"
                )

    except Exception as e:

        print(
            f"PIPELINE ERROR: {str(e)}"
        )

        jobs[job_id]["status"] = "failed"

        jobs[job_id]["error"] = str(e)

        return accumulated_state

    # ========================================================
    # PIPELINE FINISHED
    # ========================================================

    status = accumulated_state.get(
        "status"
    )

    if (
        status is not None
        and hasattr(status, "name")
        and status.name == "FAILED"
    ):

        jobs[job_id]["status"] = "failed"

        jobs[job_id]["error"] = "\n".join(
            accumulated_state.get(
                "errors",
                []
            )
        )

        print(
            "PIPELINE FINISHED — FAILED"
        )

    else:

        jobs[job_id]["status"] = (
            "completed"
        )

        jobs[job_id]["progress"] = 100

        # Make sure final stages are marked correctly
        jobs[job_id]["stages"][
            "requirements"
        ] = "completed"

        jobs[job_id]["stages"][
            "test_scripts"
        ] = "completed"

        jobs[job_id]["stages"][
            "acceptance_criteria"
        ] = "completed"

        jobs[job_id]["stages"][
            "test_cases"
        ] = "completed"

        jobs[job_id]["stages"][
            "git"
        ] = "completed"

        print(
            "PIPELINE FINISHED — COMPLETED"
        )

    print(
        f"FINAL STATUS: "
        f"{jobs[job_id]['status']}"
    )

    print(
        f"FINAL PROGRESS: "
        f"{jobs[job_id]['progress']}%"
    )

    print(
        f"FINAL STAGES: "
        f"{jobs[job_id]['stages']}"
    )

    return accumulated_state


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    # 1. Read Mock BRD

    with open(
        "mock_brd.md",
        "r"
    ) as file:

        brd_content = file.read()

    # 2. Compile Graph

    app = build_graph()

    print(
        "Starting AI Test Generation Pipeline..."
    )

    print(
        "=" * 40
    )

    # 3. Invoke Workflow

    initial_state = {
        "content": brd_content,
        "brd_id": "MOCK-BRD-001"
    }

    final_state = app.invoke(
        initial_state
    )

    print(
        "\n"
        + "=" * 40
        + "\nPipeline Complete! "
        "Check your GitHub repository "
        "for the pushed test files."
    )