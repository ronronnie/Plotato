import type { RecentPairing, UserPreferences } from "./types";

export const APP_NAME = "Plotato";

export const DESIGN_TOKENS = {
  ink: "#161616",
  paper: "#FFF7E8",
  red: "#F04438",
  yellow: "#FFD84D",
  blue: "#3559F7",
  green: "#B8F04A",
  pink: "#FF77B7",
} as const;

export const REGIONS = [
  { label: "India", value: "IN" },
  { label: "United States", value: "US" },
  { label: "United Kingdom", value: "GB" },
  { label: "Singapore", value: "SG" },
] as const;

export const STREAMING_SERVICES = [
  "Netflix",
  "Prime Video",
  "JioHotstar",
  "SonyLIV",
  "ZEE5",
  "Apple TV+",
] as const;

export const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Marathi",
] as const;

export const VIEWING_DURATIONS = [
  { label: "Quick bite", value: "quick", detail: "Under 25 minutes" },
  { label: "Proper meal", value: "proper", detail: "25-50 minutes" },
  { label: "Movie night", value: "movie", detail: "Anything goes" },
] as const;

export const DEFAULT_PREFERENCES: UserPreferences = {
  region: "IN",
  streamingServices: ["Netflix", "Prime Video", "JioHotstar"],
  languages: ["English", "Hindi"],
  viewingDuration: "proper",
  reducedMotion: "system",
  onboardingComplete: false,
};

export const MOCK_RECENT_PAIRINGS: RecentPairing[] = [
  {
    id: "ramen-b99",
    food: "Ramen",
    title: "Brooklyn Nine-Nine",
    provider: "Netflix",
    tone: "Fast comfort",
    runtime: "22 min",
    accent: "blue",
  },
  {
    id: "biryani-bear",
    food: "Biryani",
    title: "The Bear",
    provider: "JioHotstar",
    tone: "Layered chaos",
    runtime: "30 min",
    accent: "red",
  },
  {
    id: "thali-panchayat",
    food: "Thali",
    title: "Panchayat",
    provider: "Prime Video",
    tone: "Warm bite",
    runtime: "35 min",
    accent: "green",
  },
];
