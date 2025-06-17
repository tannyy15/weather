import os
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware  # Add this import
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import httpx

from sqlalchemy import create_engine, Column, Integer, String, Float, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Replace these with your actual API keys
OPENWEATHER_API_KEY = "7f7bd123b2f255c5fbcb63fcce54830a"  # Replace this with your OpenWeather API key
GOOGLE_PLACES_API_KEY = "AIzaSyCKtOVDaTrGwLvBFvYIcAJ50K8FpPudI2s"  # Replace this with your Google Places API key

OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"
GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place"

# Check if API keys are set
if OPENWEATHER_API_KEY == "your_openweather_api_key_here":
    raise RuntimeError("Please replace the OPENWEATHER_API_KEY with your actual API key.")
if GOOGLE_PLACES_API_KEY == "your_google_places_api_key_here":
    raise RuntimeError("Please replace the GOOGLE_PLACES_API_KEY with your actual API key.")
# --- Database Setup (SQLite) ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./events.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Model
class EventDB(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)  # e.g., sports, wedding, picnic
    location_name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    event_date = Column(Date)

# Create database tables
Base.metadata.create_all(bind=engine)

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Models ---
class EventBase(BaseModel):
    name: str
    type: str
    location: str = Field(alias="location_name") # Map 'location' from request body to 'location_name' in internal model
    event_date: date

    class Config:
        populate_by_name = True # Allow alias to be used for population

class EventCreate(EventBase):
    pass

class WeatherData(BaseModel):
    temperature: float
    feels_like: float
    min_temp: float
    max_temp: float
    pressure: int
    humidity: int
    wind_speed: float
    wind_deg: int
    clouds: int
    weather_main: str
    weather_description: str
    weather_icon: str
    rain_probability: float = Field(default=0.0, description="Probability of precipitation (0-1)")
    rain_volume_1h: float = Field(default=0.0, description="Rain volume for last 1 hour, mm")
    rain_volume_3h: float = Field(default=0.0, description="Rain volume for last 3 hours, mm")
    dt_txt: datetime # Original forecast time

class WeatherForecastResponse(BaseModel):
    location: str
    latitude: float
    longitude: float
    date: date
    forecast: Optional[WeatherData] = None
    message: str = "Forecast data might be aggregated or picked from nearest point."

class SuitabilityScoreResponse(BaseModel):
    event_id: int
    event_name: str
    event_type: str
    event_date: date
    location: str
    suitability_score: int
    suitability_details: Dict[str, Any]
    weather_at_event_time: Optional[WeatherData] = None
    message: str

class AlternativeDateResponse(BaseModel):
    date: date
    suitability_score: int
    suitability_details: Dict[str, Any]
    weather_at_date: Optional[WeatherData] = None

class EventResponse(EventBase):
    id: int
    latitude: float
    longitude: float
    weather_status: Optional[str] = None # Placeholder for a quick status summary
    suitability_score: Optional[int] = None # Quick suitability score summary

# --- External API Clients ---
class OpenWeatherMapClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(base_url=OPENWEATHER_BASE_URL)

    async def get_5day_forecast(self, lat: float, lon: float) -> Dict[str, Any]:
        """Fetches 5-day/3-hour forecast data from OpenWeatherMap."""
        try:
            response = await self.client.get(
                f"/forecast?lat={lat}&lon={lon}&appid={self.api_key}&units=metric"
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OpenWeatherMap API key.")
            elif e.response.status_code == 429:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="OpenWeatherMap API rate limit exceeded.")
            raise HTTPException(status_code=e.response.status_code, detail=f"OpenWeatherMap API error: {e.response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Network error communicating with OpenWeatherMap: {e}")

class GooglePlacesClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(base_url=GOOGLE_PLACES_BASE_URL)

    async def geocode_place(self, place_name: str) -> Dict[str, Any]:
        """Geocodes a place name to latitude and longitude using Google Places Text Search."""
        try:
            response = await self.client.get(
                f"/textsearch/json?query={place_name}&key={self.api_key}"
            )
            response.raise_for_status()
            data = response.json()
            if data['status'] == 'OK' and data['results']:
                location = data['results'][0]['geometry']['location']
                return {"latitude": location['lat'], "longitude": location['lng'], "formatted_address": data['results'][0]['formatted_address']}
            elif data['status'] == 'ZERO_RESULTS':
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location '{place_name}' not found by Google Places.")
            else:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Google Places API error: {data['status']} - {data.get('error_message', 'Unknown error')}")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google Places API key.")
            elif e.response.status_code == 429:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Google Places API rate limit exceeded.")
            raise HTTPException(status_code=e.response.status_code, detail=f"Google Places API error: {e.response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Network error communicating with Google Places: {e}")

# Initialize clients
openweathermap_client = OpenWeatherMapClient(OPENWEATHER_API_KEY)
google_places_client = GooglePlacesClient(GOOGLE_PLACES_API_KEY)

# --- Utility Functions ---

def get_weather_for_date(forecast_data: Dict[str, Any], target_date: date) -> Optional[WeatherData]:
    """
    Extracts relevant weather data for a specific date from OpenWeatherMap's 5-day forecast.
    It attempts to find the data point closest to noon (12:00 UTC) for the target date.
    If no data for the specific date is found, it returns None.
    """
    if 'list' not in forecast_data:
        return None

    target_forecast = None
    min_time_diff = timedelta(days=999) # Initialize with a large difference

    for item in forecast_data['list']:
        dt_txt = datetime.strptime(item['dt_txt'], '%Y-%m-%d %H:%M:%S')
        if dt_txt.date() == target_date:
            # Calculate difference from noon UTC for current item
            noon_time = dt_txt.replace(hour=12, minute=0, second=0, microsecond=0)
            time_diff = abs(dt_txt - noon_time)

            if time_diff < min_time_diff:
                min_time_diff = time_diff
                # Parse rain information safely
                rain_1h = item.get('rain', {}).get('1h', 0.0)
                rain_3h = item.get('rain', {}).get('3h', 0.0)
                # OpenWeatherMap doesn't directly provide rain probability in /forecast endpoint.
                # 'pop' (probability of precipitation) is available in daily forecasts.
                # For 3-hour forecasts, we'll approximate or default to 0 if not present.
                pop = item.get('pop', 0.0) # Probability of precipitation (0 to 1)

                target_forecast = WeatherData(
                    temperature=item['main']['temp'],
                    feels_like=item['main']['feels_like'],
                    min_temp=item['main']['temp_min'],
                    max_temp=item['main']['temp_max'],
                    pressure=item['main']['pressure'],
                    humidity=item['main']['humidity'],
                    wind_speed=item['wind']['speed'],
                    wind_deg=item['wind']['deg'],
                    clouds=item['clouds']['all'],
                    weather_main=item['weather'][0]['main'],
                    weather_description=item['weather'][0]['description'],
                    weather_icon=item['weather'][0]['icon'],
                    rain_probability=pop,
                    rain_volume_1h=rain_1h,
                    rain_volume_3h=rain_3h,
                    dt_txt=dt_txt
                )
    return target_forecast

def calculate_suitability_score(event_type: str, weather: WeatherData) -> Dict[str, Any]:
    """
    Calculates a suitability score and details based on event type and weather data.
    Score range: 0-100 (higher is better).
    """
    score = 0
    details = {}

    # Common ideal ranges
    ideal_temp_range = (15, 30) # C
    max_acceptable_rain_prob = 0.20 # 20%
    max_acceptable_wind_speed = 20 # km/h (approx 5.5 m/s, OpenWeatherMap is m/s)
    
    # Convert m/s to km/h for easier comparison if needed, OpenWeatherMap gives m/s by default
    wind_speed_kmh = weather.wind_speed * 3.6

    # Scoring based on general conditions
    # Temperature
    if ideal_temp_range[0] <= weather.temperature <= ideal_temp_range[1]:
        score += 30
        details['temperature_score'] = "+30 (Ideal)"
    elif (ideal_temp_range[0] - 5 <= weather.temperature < ideal_temp_range[0]) or \
         (ideal_temp_range[1] < weather.temperature <= ideal_temp_range[1] + 5):
        score += 15
        details['temperature_score'] = "+15 (Acceptable)"
    else:
        details['temperature_score'] = "0 (Extreme)"

    # Precipitation
    # Use rain_probability if available, otherwise check rain_volume
    if weather.rain_probability <= max_acceptable_rain_prob or \
       (weather.rain_probability == 0.0 and weather.rain_volume_1h == 0.0 and weather.rain_volume_3h == 0.0):
        score += 25
        details['precipitation_score'] = "+25 (Low Rain Risk)"
    elif weather.rain_probability > max_acceptable_rain_prob and weather.rain_probability <= 0.50:
        score += 10
        details['precipitation_score'] = "+10 (Moderate Rain Risk)"
    else:
        details['precipitation_score'] = "0 (High Rain Risk)"

    # Wind
    if wind_speed_kmh < max_acceptable_wind_speed:
        score += 20
        details['wind_score'] = "+20 (Low Wind)"
    elif max_acceptable_wind_speed <= wind_speed_kmh < 40:
        score += 10
        details['wind_score'] = "+10 (Moderate Wind)"
    else:
        details['wind_score'] = "0 (High Wind)"

    # Sky Condition (Clear/Clouds generally preferred)
    if weather.weather_main in ["Clear", "Clouds"]:
        score += 25
        details['sky_score'] = "+25 (Clear/Cloudy)"
    elif weather.weather_main in ["Drizzle", "Mist", "Smoke", "Haze", "Fog", "Sand", "Dust", "Ash", "Squall", "Tornado"]:
        score += 5
        details['sky_score'] = "+5 (Sub-optimal Visibility)"
    else: # Rain, Snow, Thunderstorm, Extreme
        details['sky_score'] = "0 (Poor Sky Condition)"

    # Event Type specific adjustments (e.g., sports needs clearer sky, less wind)
    if event_type.lower() == "sports":
        if wind_speed_kmh > 30: # Sports more sensitive to high wind
            score = max(0, score - 15) # Penalize more for very high wind
            details['sports_adjustment'] = "-15 (Very High Wind for Sports)"
        if weather.weather_main not in ["Clear", "Clouds"]:
            score = max(0, score - 10) # Penalize for non-ideal sky for sports
            details['sports_adjustment_sky'] = "-10 (Non-ideal Sky for Sports)"
    elif event_type.lower() == "wedding":
        if weather.rain_probability > 0.10: # Weddings more sensitive to any rain
            score = max(0, score - 20)
            details['wedding_adjustment'] = "-20 (Rain for Wedding)"
        if weather.temperature < 10 or weather.temperature > 35: # Weddings sensitive to extreme temps
            score = max(0, score - 15)
            details['wedding_adjustment_temp'] = "-15 (Extreme Temp for Wedding)"


    details['final_score_raw'] = score
    # Normalize score to 0-100 range if necessary, but with max initial score being 100, no normalization needed now.
    final_score = min(100, max(0, score))
    details['final_score_normalized'] = final_score
    return {"score": final_score, "details": details}

# --- FastAPI Application ---
app = FastAPI(
    title="Weather-Aware Event Planning API",
    description="A FastAPI backend to help plan outdoor events by integrating with OpenWeatherMap for weather data and Google Places API for geocoding.",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---

@app.get("/", summary="Root endpoint for API status check")
async def root():
    return {"message": "Weather-Aware Event Planning API is running!"}


@app.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED, summary="Create a new event")
async def create_event(event: EventCreate, db: Session = Depends(get_db)):
    """
    Creates a new event. The location will be geocoded using Google Places API.
    """
    try:
        # Geocode the location
        # CORRECTED: Access 'location' field directly from the Pydantic model
        geocode_result = await google_places_client.geocode_place(event.location)
        latitude = geocode_result['latitude']
        longitude = geocode_result['longitude']
        formatted_address = geocode_result['formatted_address']
        print(f"Geocoded '{event.location}' to lat={latitude}, lon={longitude}") # Use event.location for printing too

        db_event = EventDB(
            name=event.name,
            type=event.type,
            location_name=formatted_address, # Store the more precise formatted address
            latitude=latitude,
            longitude=longitude,
            event_date=event.event_date
        )
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return EventResponse(
            id=db_event.id,
            name=db_event.name,
            type=db_event.type,
            location=db_event.location_name,
            latitude=db_event.latitude,
            longitude=db_event.longitude,
            event_date=db_event.event_date
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create event: {e}")

@app.get("/events", response_model=List[EventResponse], summary="List all events with weather status")
async def list_events(db: Session = Depends(get_db)):
    """
    Retrieves a list of all planned events. For each event, it attempts to fetch
    the current weather forecast and provides a suitability score and status.
    """
    events = db.query(EventDB).all()
    response_events: List[EventResponse] = []
    for event in events:
        weather_status = "N/A"
        suitability_score = None
        try:
            forecast_data = await openweathermap_client.get_5day_forecast(event.latitude, event.longitude)
            weather_at_date = get_weather_for_date(forecast_data, event.event_date)
            if weather_at_date:
                suitability_info = calculate_suitability_score(event.type, weather_at_date)
                suitability_score = suitability_info['score']
                if suitability_score >= 80:
                    weather_status = "Excellent"
                elif suitability_score >= 60:
                    weather_status = "Good"
                elif suitability_score >= 40:
                    weather_status = "Fair"
                else:
                    weather_status = "Poor"
            else:
                weather_status = "Forecast Unavailable"
        except HTTPException as e:
            weather_status = f"Weather Error: {e.detail}"
        except Exception as e:
            weather_status = f"Unexpected Error: {e}"

        response_events.append(
            EventResponse(
                id=event.id,
                name=event.name,
                type=event.type,
                location=event.location_name,
                latitude=event.latitude,
                longitude=event.longitude,
                event_date=event.event_date,
                weather_status=weather_status,
                suitability_score=suitability_score
            )
        )
    return response_events

@app.put("/events/{event_id}", response_model=EventResponse, summary="Update an existing event")
async def update_event(event_id: int, event_update: EventCreate, db: Session = Depends(get_db)):
    """
    Updates an existing event's details. If the location is changed, it will be re-geocoded.
    """
    db_event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if location has changed and re-geocode if necessary
    # CORRECTED: Access 'location' field directly from the Pydantic model for event_update
    if db_event.location_name != event_update.location: 
        try:
            # CORRECTED: Access 'location' field directly from the Pydantic model for event_update
            geocode_result = await google_places_client.geocode_place(event_update.location)
            db_event.latitude = geocode_result['latitude']
            db_event.longitude = geocode_result['longitude']
            db_event.location_name = geocode_result['formatted_address'] # Update to formatted address
        except HTTPException as e:
            raise e # Re-raise geocoding errors
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to re-geocode location: {e}")

    db_event.name = event_update.name
    db_event.type = event_update.type
    db_event.event_date = event_update.event_date

    db.commit()
    db.refresh(db_event)
    return EventResponse(
        id=db_event.id,
        name=db_event.name,
        type=db_event.type,
        location=db_event.location_name,
        latitude=db_event.latitude,
        longitude=db_event.longitude,
        event_date=db_event.event_date
    )

@app.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an event")
async def delete_event(event_id: int, db: Session = Depends(get_db)):
    """
    Deletes an event from the database.
    """
    db_event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return {"message": "Event deleted successfully"}

@app.get("/weather/{location_name}/{target_date}", response_model=WeatherForecastResponse, summary="Get weather forecast for a specific location and date")
async def get_weather_forecast(location_name: str, target_date: date):
    """
    Fetches the 5-day/3-hour weather forecast for a given location and attempts to
    extract the relevant forecast for the specified date.
    """
    try:
        # Geocode the location first
        geocode_result = await google_places_client.geocode_place(location_name)
        latitude = geocode_result['latitude']
        # CORRECTED: Access 'longitude' using the correct key 'longitude'
        longitude = geocode_result['longitude']
        formatted_address = geocode_result['formatted_address']

        # Get 5-day forecast from OpenWeatherMap
        forecast_data = await openweathermap_client.get_5day_forecast(latitude, longitude)

        # Extract weather for the specific date
        weather_at_date = get_weather_for_date(forecast_data, target_date)

        if weather_at_date:
            return WeatherForecastResponse(
                location=formatted_address,
                latitude=latitude,
                longitude=longitude,
                date=target_date,
                forecast=weather_at_date,
                message=f"Forecast for {target_date} at {weather_at_date.dt_txt.strftime('%H:%M')} UTC."
            )
        else:
            return WeatherForecastResponse(
                location=formatted_address,
                latitude=latitude,
                longitude=longitude,
                date=target_date,
                forecast=None,
                message=f"No precise forecast available for {target_date} within the 5-day window. The OpenWeatherMap 5-day forecast provides data every 3 hours."
            )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to get weather forecast: {e}")


@app.get("/events/{event_id}/suitability", response_model=SuitabilityScoreResponse, summary="Get suitability score for an event")
async def get_event_suitability(event_id: int, db: Session = Depends(get_db)):
    """
    Calculates the weather suitability score for a specific event based on its
    type and the forecasted weather conditions.
    """
    db_event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    try:
        forecast_data = await openweathermap_client.get_5day_forecast(db_event.latitude, db_event.longitude)
        weather_at_event_time = get_weather_for_date(forecast_data, db_event.event_date)

        if not weather_at_event_time:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No forecast available for event date {db_event.event_date}."
            )

        suitability_info = calculate_suitability_score(db_event.type, weather_at_event_time)
        score = suitability_info['score']
        details = suitability_info['details']

        return SuitabilityScoreResponse(
            event_id=db_event.id,
            event_name=db_event.name,
            event_type=db_event.type,
            location=db_event.location_name,
            suitability_score=score,
            suitability_details=details,
            weather_at_event_time=weather_at_event_time,
            message="Suitability score calculated successfully."
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to calculate suitability: {e}")


@app.get("/events/{event_id}/alternatives", response_model=List[AlternativeDateResponse], summary="Suggest alternative dates with better weather")
async def get_alternative_dates(event_id: int, db: Session = Depends(get_db)):
    """
    Suggests alternative dates within +/- 2 days of the original event date
    that might have better weather suitability scores.
    """
    db_event = db.query(EventDB).filter(EventDB.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    alternative_dates: List[AlternativeDateResponse] = []
    
    try:
        forecast_data = await openweathermap_client.get_5day_forecast(db_event.latitude, db_event.longitude)
        
        # Get original event's suitability score for comparison
        original_weather = get_weather_for_date(forecast_data, db_event.event_date)
        original_score = 0
        if original_weather:
            original_score = calculate_suitability_score(db_event.type, original_weather)['score']
        
        for i in range(-2, 3): # Check -2, -1, 0 (original), +1, +2 days
            current_date = db_event.event_date + timedelta(days=i)
            # Skip the original date if it's already processed, or if it's the current date
            if current_date == db_event.event_date and i != 0:
                continue

            # Ensure the date is within the 5-day forecast window
            # OpenWeatherMap's 5-day forecast typically covers about 5 days from 'now'.
            # We assume 'now' is the current server date.
            today = date.today()
            if current_date < today or current_date > today + timedelta(days=5):
                 # print(f"Skipping {current_date}: outside 5-day forecast window from {today}.")
                 continue
            
            weather_at_alt_date = get_weather_for_date(forecast_data, current_date)
            
            if weather_at_alt_date:
                suitability_info = calculate_suitability_score(db_event.type, weather_at_alt_date)
                alt_score = suitability_info['score']
                alt_details = suitability_info['details']

                # Only suggest if the alternative date has a better or equal score
                if alt_score >= original_score:
                    alternative_dates.append(
                        AlternativeDateResponse(
                            date=current_date,
                            suitability_score=alt_score,
                            suitability_details=alt_details,
                            weather_at_date=weather_at_alt_date
                        )
                    )
            # else:
                # print(f"No weather data for {current_date} from OpenWeatherMap forecast.")

        # Sort alternatives by suitability score in descending order
        alternative_dates.sort(key=lambda x: x.suitability_score, reverse=True)
        
        # Filter out the original date if its score is not among the best,
        # or keep it if it's one of the best.
        # This simple filter might remove the original if a strictly better one exists.
        # A more robust solution would be to always include the original, then list alternatives.
        # For this prompt, "better dates" implies strictly better or equally good if few alternatives.
        final_suggestions = [alt for alt in alternative_dates if alt.suitability_score >= original_score]
        
        # Ensure the original date is included if its score is relevant among alternatives,
        # or if no better alternatives are found.
        # To avoid duplicates if original date is already added:
        unique_suggestions = []
        seen_dates = set()
        for alt in final_suggestions:
            if alt.date not in seen_dates:
                unique_suggestions.append(alt)
                seen_dates.add(alt.date)

        return unique_suggestions

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to suggest alternative dates: {e}")
