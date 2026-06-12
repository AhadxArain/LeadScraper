import json
import asyncio
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from scraper_engine import run_scraper
from storage.csv_store import (
    load_valid_leads,
    load_rejected_leads,
    load_run_logs,
    load_all_time_unique_leads,
    clear_all_data,
)

app = FastAPI(title="EnergyCenterUSA Scraper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    business_type: str
    zip_code: str
    required_leads: int


def sse_format(data: Any) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def scrape_stream(business_type: str, zip_code: str, required_leads: int):
    try:
        gen = run_scraper(business_type, zip_code, required_leads)
        loop = asyncio.get_event_loop()

        while True:
            status = await loop.run_in_executor(None, _safe_next, gen)
            if status is None:
                break
            yield sse_format(status)
            await asyncio.sleep(0)

    except Exception as e:
        yield sse_format({"error": str(e), "done": True})


def _safe_next(gen):
    try:
        return next(gen)
    except StopIteration:
        return None


@app.post("/scrape")
async def scrape(req: ScrapeRequest):
    return StreamingResponse(
        scrape_stream(req.business_type, req.zip_code, req.required_leads),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/leads")
async def get_all_leads():
    return load_all_time_unique_leads().to_dict(orient="records")


@app.get("/leads/valid")
async def get_valid_leads():
    return load_valid_leads().to_dict(orient="records")


@app.get("/leads/rejected")
async def get_rejected_leads():
    return load_rejected_leads().to_dict(orient="records")


@app.get("/leads/logs")
async def get_run_logs():
    return load_run_logs().to_dict(orient="records")


@app.delete("/leads")
async def delete_all_leads():
    try:
        clear_all_data()
        return {"success": True, "message": "All data cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))