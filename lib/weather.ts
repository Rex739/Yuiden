export type WeatherSnapshot = {
  source: "open-meteo" | "fallback";
  location: "Tokyo";
  observedAt: string;
  forecastHour: string;
  temperatureC: number;
  cloudCoverPct: number;
  shortwaveRadiation: number;
  precipitationProbabilityPct: number;
  weatherCode?: number;
  solarCondition: "excellent" | "good" | "moderate" | "weak";
  solarMultiplier: number;
  demandBias: "low" | "normal" | "high";
  summary: string;
};

type OpenMeteoForecast = {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    cloud_cover?: number[];
    shortwave_radiation?: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
  };
};

const TOKYO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const TOKYO_LATITUDE = "35.6762";
const TOKYO_LONGITUDE = "139.6503";
const TOKYO_TIMEZONE = "Asia/Tokyo";

export function createFallbackWeatherSnapshot(): WeatherSnapshot {
  const observedAt = new Date().toISOString();

  return {
    source: "fallback",
    location: "Tokyo",
    observedAt,
    forecastHour: observedAt,
    temperatureC: 22,
    cloudCoverPct: 45,
    shortwaveRadiation: 420,
    precipitationProbabilityPct: 20,
    solarCondition: "good",
    solarMultiplier: 1,
    demandBias: "normal",
    summary: "Weather forecast unavailable. Using neutral Tokyo solar and demand assumptions.",
  };
}

export async function fetchTokyoWeatherSnapshot(): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: TOKYO_LATITUDE,
    longitude: TOKYO_LONGITUDE,
    hourly: "temperature_2m,cloud_cover,shortwave_radiation,precipitation_probability,weather_code",
    forecast_days: "1",
    timezone: TOKYO_TIMEZONE,
  });

  try {
    const response = await fetch(`${TOKYO_FORECAST_URL}?${params.toString()}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return createFallbackWeatherSnapshot();
    }

    const forecast = (await response.json()) as OpenMeteoForecast;
    const snapshot = snapshotFromForecast(forecast);
    return snapshot ?? createFallbackWeatherSnapshot();
  } catch {
    return createFallbackWeatherSnapshot();
  }
}

function snapshotFromForecast(forecast: OpenMeteoForecast): WeatherSnapshot | null {
  const hourly = forecast.hourly;

  if (!hourly?.time?.length) {
    return null;
  }

  const now = new Date();
  const forecastIndex = pickForecastIndex(hourly.time, now);
  const temperatureC = readNumber(hourly.temperature_2m, forecastIndex, 22);
  const cloudCoverPct = readNumber(hourly.cloud_cover, forecastIndex, 45);
  const shortwaveRadiation = readNumber(hourly.shortwave_radiation, forecastIndex, 420);
  const precipitationProbabilityPct = readNumber(hourly.precipitation_probability, forecastIndex, 20);
  const weatherCode = hourly.weather_code?.[forecastIndex];
  const solarCondition = classifySolarCondition(shortwaveRadiation, cloudCoverPct, precipitationProbabilityPct);
  const solarMultiplier = getSolarMultiplier(solarCondition);
  const demandBias = classifyDemandBias(temperatureC, precipitationProbabilityPct);

  return {
    source: "open-meteo",
    location: "Tokyo",
    observedAt: now.toISOString(),
    forecastHour: hourly.time[forecastIndex] ?? now.toISOString(),
    temperatureC,
    cloudCoverPct,
    shortwaveRadiation,
    precipitationProbabilityPct,
    weatherCode,
    solarCondition,
    solarMultiplier,
    demandBias,
    summary: buildWeatherSummary({
      solarCondition,
      solarMultiplier,
      demandBias,
      temperatureC,
      cloudCoverPct,
      shortwaveRadiation,
      precipitationProbabilityPct,
    }),
  };
}

function pickForecastIndex(times: string[], now: Date) {
  const currentTime = now.getTime();
  const index = times.findIndex((time) => new Date(time).getTime() >= currentTime);
  return index >= 0 ? index : 0;
}

function readNumber(values: number[] | undefined, index: number, fallback: number) {
  const value = values?.[index];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function classifySolarCondition(
  shortwaveRadiation: number,
  cloudCoverPct: number,
  precipitationProbabilityPct: number,
): WeatherSnapshot["solarCondition"] {
  if (shortwaveRadiation >= 650 && cloudCoverPct <= 30 && precipitationProbabilityPct <= 30) return "excellent";
  if (shortwaveRadiation >= 420 && cloudCoverPct <= 55 && precipitationProbabilityPct <= 45) return "good";
  if (shortwaveRadiation >= 180 && cloudCoverPct <= 80) return "moderate";
  return "weak";
}

function getSolarMultiplier(condition: WeatherSnapshot["solarCondition"]) {
  if (condition === "excellent") return 1.16;
  if (condition === "good") return 1.04;
  if (condition === "moderate") return 0.88;
  return 0.68;
}

function classifyDemandBias(temperatureC: number, precipitationProbabilityPct: number): WeatherSnapshot["demandBias"] {
  if (temperatureC >= 30 || temperatureC <= 8 || precipitationProbabilityPct >= 70) return "high";
  if (temperatureC >= 18 && temperatureC <= 24 && precipitationProbabilityPct <= 25) return "low";
  return "normal";
}

function buildWeatherSummary({
  solarCondition,
  solarMultiplier,
  demandBias,
  temperatureC,
  cloudCoverPct,
  shortwaveRadiation,
  precipitationProbabilityPct,
}: Pick<
  WeatherSnapshot,
  | "solarCondition"
  | "solarMultiplier"
  | "demandBias"
  | "temperatureC"
  | "cloudCoverPct"
  | "shortwaveRadiation"
  | "precipitationProbabilityPct"
>) {
  return `Tokyo forecast is ${solarCondition} for solar (${Math.round(
    shortwaveRadiation,
  )} W/m2, ${Math.round(cloudCoverPct)}% cloud cover), applying a ${solarMultiplier.toFixed(
    2,
  )}x solar confidence multiplier with ${demandBias} demand bias at ${Math.round(
    temperatureC,
  )}C and ${Math.round(precipitationProbabilityPct)}% precipitation risk.`;
}
