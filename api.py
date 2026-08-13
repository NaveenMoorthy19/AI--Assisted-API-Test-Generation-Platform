# import uuid
# import fitz

# from fastapi import FastAPI, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware

# from run import execute_pipeline
# from agents.state import JobStatus

# app = FastAPI()

# # ---------------- CORS ---------------- #

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],   # For development
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ---------------- Job Store ---------------- #

# jobs = {}

# # ---------------- Extract PDF ---------------- #

# def extract_pdf_text(pdf_bytes):
#     document = fitz.open(stream=pdf_bytes, filetype="pdf")

#     text = ""
#     for page in document:
#         text += page.get_text()

#     return text


# # ---------------- Upload API ---------------- #

# @app.post("/upload")
# async def upload(file: UploadFile = File(...)):

#     job_id = str(uuid.uuid4())

#     jobs[job_id] = {
#         "job_id": job_id,
#         "status": "running",
#         "progress": 10,
#         "data": None,
#         "error": None
#     }

#     try:
#         pdf_bytes = await file.read()

#         brd_text = extract_pdf_text(pdf_bytes)

#         # Execute LangGraph pipeline
#         result = execute_pipeline(brd_text)

#         jobs[job_id]["data"] = result
#         jobs[job_id]["progress"] = 100

#         # Pipeline failed
#         if result.get("status") == JobStatus.FAILED:
#             jobs[job_id]["status"] = "failed"
#             jobs[job_id]["error"] = "\n".join(result.get("errors", []))

#         # Pipeline succeeded
#         else:
#             jobs[job_id]["status"] = "completed"

#     except Exception as e:

#         jobs[job_id]["status"] = "failed"
#         jobs[job_id]["progress"] = 100
#         jobs[job_id]["error"] = str(e)

#     return {
#         "job_id": job_id,
#         "filename": file.filename,
#         "message": "Pipeline Started"
#     }


# # ---------------- Status API ---------------- #

# @app.get("/status/{job_id}")
# def status(job_id: str):

#     if job_id not in jobs:
#         return {
#             "error": "Invalid Job Id"
#         }

#     return jobs[job_id]

import uuid
import traceback
import fitz

from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

# from run import execute_pipeline
from run import execute_pipeline_streaming
from agents.state import JobStatus

app = FastAPI()

# ---------------- CORS ---------------- #

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Job Store ---------------- #

jobs = {}

# ---------------- Extract PDF ---------------- #

def extract_pdf_text(pdf_bytes):
    document = fitz.open(stream=pdf_bytes, filetype="pdf")

    text = ""
    for page in document:
        text += page.get_text()

    return text


# ---------------- Upload API ---------------- #
# ---------------- Upload API ----------------

@app.post("/upload")
async def upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):

    job_id = str(uuid.uuid4())

    # Initialize job immediately
    jobs[job_id] = {
        "job_id": job_id,
        "status": "running",
        "progress": 0,
        "data": {},
        "error": None,

        "stages": {
            "requirements": "pending",
            "acceptance_criteria": "pending",
            "test_cases": "pending",
            "test_scripts": "pending",
            "git": "pending"
        }
    }

    try:

        print("=" * 80)
        print(f"JOB STARTED : {job_id}")
        print("=" * 80)

        # Read uploaded PDF
        pdf_bytes = await file.read()

        print(f"Uploaded File : {file.filename}")
        print(f"File Size     : {len(pdf_bytes)} bytes")

        # Extract BRD text
        brd_text = extract_pdf_text(pdf_bytes)

        print("PDF extraction completed.")

        # ------------------------------------------------
        # IMPORTANT:
        # DO NOT execute the pipeline directly here.
        # ------------------------------------------------

        background_tasks.add_task(
            execute_pipeline_streaming,
            brd_text,
            job_id,
            jobs
        )

        print(
            f"Pipeline started in background for job: {job_id}"
        )

        # Return immediately to frontend
        return {
            "job_id": job_id,
            "filename": file.filename,
            "message": "Pipeline Started"
        }

    except Exception as e:

        print("\n" + "=" * 80)
        print("UPLOAD FAILED")
        print("=" * 80)

        traceback.print_exc()

        jobs[job_id]["status"] = "failed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["error"] = str(e)

        return {
            "job_id": job_id,
            "filename": file.filename,
            "message": "Upload failed",
            "error": str(e)
        }

# @app.post("/upload")
# async def upload(background_tasks:BackgroundTasks,file: UploadFile = File(...)):

#     job_id = str(uuid.uuid4())

#     jobs[job_id] = {
#         "job_id": job_id,
#         "status": "running",
#         "progress": 10,
#         "data": None,
#         "error": None
#     }
#     try:
#         print("=" * 80)
#         print(f"JOB STARTED : {job_id}")
#         print("=" * 80)

#         pdf_bytes = await file.read()

#         print(f"Uploaded File : {file.filename}")
#         print(f"File Size     : {len(pdf_bytes)} bytes")

#         brd_text = extract_pdf_text(pdf_bytes)

#         print("PDF extraction completed.")
#         print("Starting LangGraph pipeline...\n")

#         # Execute LangGraph pipeline (streaming — updates jobs[job_id] as each node completes)
#         result = execute_pipeline_streaming(brd_text, job_id, jobs)

#         print("\nLangGraph pipeline completed successfully.")
#         print(f"Pipeline returned {jobs[job_id]['status'].upper()} status.")

#         # jobs[job_id]["data"], ["progress"], ["status"], and ["error"]
#         # are already fully populated by execute_pipeline_streaming — nothing more to set here.

#     except Exception as e:

#         print("\n" + "=" * 80)
#         print("PIPELINE CRASHED")
#         print("=" * 80)

#         traceback.print_exc()

#         print("=" * 80)
#         print("Exception Type :", type(e).__name__)
#         print("Exception      :", str(e))
#         print("=" * 80)

#         jobs[job_id]["status"] = "failed"
#         jobs[job_id]["progress"] = 100
#         jobs[job_id]["error"] = str(e)

#     print(f"Returning Upload Response for Job : {job_id}")

#     return {
#         "job_id": job_id,
#         "filename": file.filename,
#         "message": "Pipeline Started"
#     }

    # try:
    #     print("=" * 80)
    #     print(f"JOB STARTED : {job_id}")
    #     print("=" * 80)

    #     pdf_bytes = await file.read()

    #     print(f"Uploaded File : {file.filename}")
    #     print(f"File Size     : {len(pdf_bytes)} bytes")

    #     brd_text = extract_pdf_text(pdf_bytes)

    #     print("PDF extraction completed.")
    #     print("Starting LangGraph pipeline...\n")

    #     # Execute LangGraph pipeline
    #     result = execute_pipeline(brd_text)

    #     print("\nLangGraph pipeline completed successfully.")

    #     jobs[job_id]["data"] = result
    #     jobs[job_id]["progress"] = 100

    #     # Pipeline failed
    #     if result.get("status") == JobStatus.FAILED:

    #         print("Pipeline returned FAILED status.")

    #         jobs[job_id]["status"] = "failed"
    #         jobs[job_id]["error"] = "\n".join(result.get("errors", []))

    #     # Pipeline succeeded
    #     else:

    #         print("Pipeline returned COMPLETED status.")

    #         jobs[job_id]["status"] = "completed"

    # except Exception as e:

    #     print("\n" + "=" * 80)
    #     print("PIPELINE CRASHED")
    #     print("=" * 80)

    #     traceback.print_exc()

    #     print("=" * 80)
    #     print("Exception Type :", type(e).__name__)
    #     print("Exception      :", str(e))
    #     print("=" * 80)

    #     jobs[job_id]["status"] = "failed"
    #     jobs[job_id]["progress"] = 100
    #     jobs[job_id]["error"] = str(e)

    # print(f"Returning Upload Response for Job : {job_id}")

    # return {
    #     "job_id": job_id,
    #     "filename": file.filename,
    #     "message": "Pipeline Started"
    # }


# ---------------- Status API ---------------- #

@app.get("/status/{job_id}")
def status(job_id: str):

    print(f"STATUS REQUEST RECEIVED : {job_id}")

    if job_id not in jobs:
        return {
            "error": "Invalid Job Id"
        }

    print(
        f"Status : {jobs[job_id]['status']} | "
        f"Progress : {jobs[job_id]['progress']}"
    )

    return jobs[job_id]