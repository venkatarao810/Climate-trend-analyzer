from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np
import pymongo
import requests

def get_real_temperatures(lat, lon, year):
    start_date = f"{year}-01-01"
    end_date = f"{year}-12-31"
    url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}"
        f"&start_date={start_date}&end_date={end_date}"
        f"&daily=temperature_2m_max"
        f"&timezone=UTC"
    )
    response = requests.get(url)
    data = response.json()
    if "daily" in data and "temperature_2m_max" in data["daily"]:
        return data["daily"]["temperature_2m_max"]
    return []

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client.climate

class HazardRequest(BaseModel):
    lat: float
    lon: float
    start_year: int
    end_year: int

@app.post("/api/heatwave-trend")
def analyze_heatwave(data: HazardRequest):
    result = []
    for year in range(data.start_year, data.end_year + 1):
        temps = get_real_temperatures(data.lat, data.lon, year)

        if not temps:
            result.append({"year": year, "heatwave_events": 0})
            continue  # ✅ Correct: inside the for loop

        threshold = np.percentile(temps, 95)
        heatwave_days = [1 if t > threshold else 0 for t in temps]
        count = count_heatwave_events(heatwave_days)
        result.append({"year": year, "heatwave_events": count})
        db.heatwave.update_one({"year": year}, {"$set": {"events": count}}, upsert=True)

    return result



def count_heatwave_events(days):
    count, i = 0, 0
    while i < len(days):
        if days[i] == 1:
            length = 0
            while i < len(days) and days[i] == 1:
                length += 1
                i += 1
            if length >= 3:
                count += 1
        else:
            i += 1
    return count
