export type ViewingDuration = "quick" | "proper" | "movie";

export type MotionPreference = "system" | "reduced" | "full";

export type UserPreferences = {
  region: string;
  streamingServices: string[];
  languages: string[];
  viewingDuration: ViewingDuration;
  reducedMotion: MotionPreference;
  onboardingComplete: boolean;
};

export type FeedbackAction = "seen" | "rejected" | "watched" | "saved";

export type FeedbackReason =
  | "already-watched"
  | "too-long"
  | "wrong-mood"
  | "disliked-genre"
  | "not-on-platform";

export type FeedbackRecord = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  action: FeedbackAction;
  reason?: FeedbackReason;
  createdAt: string;
};

export type RecentPairing = {
  id: string;
  food: string;
  title: string;
  provider: string;
  tone: string;
  runtime: string;
  accent: "red" | "yellow" | "blue" | "green" | "pink";
};
