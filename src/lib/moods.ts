export const primaryMoods = [
  "happy",
  "sad",
  "calm",
  "energetic",
  "romantic",
  "focus",
  "party",
  "workout",
  "nostalgic",
  "angry",
] as const;

export type PrimaryMood = (typeof primaryMoods)[number];

export const moodLabels: Record<PrimaryMood, string> = {
  happy: "Happy",
  sad: "Sad",
  calm: "Calm",
  energetic: "Energetic",
  romantic: "Romantic",
  focus: "Focus",
  party: "Party",
  workout: "Workout",
  nostalgic: "Nostalgic",
  angry: "Angry",
};

export function isPrimaryMood(value: string): value is PrimaryMood {
  return primaryMoods.includes(value as PrimaryMood);
}
