export type PlayerProfile = {
  slug: string;
  name: string;
  displayName: string;
  dek: string;
  positions: string[];
  batsThrows?: string;
  born?: string;
  birthplace?: string;
  teams: string[];
  careerYears?: string;
  heroStat?: string;
  bio: string[];
  trivia: string[];
  timeline: { year: string; label: string; detail: string }[];
  collectingNotes: string[];
  knownCards?: {
    totalLabel: string;
    sourceName: string;
    sourceUrl: string;
    note: string;
    keyCards: {
      year: string;
      setName: string;
      cardNumber: string;
      team?: string;
      category: string;
      note: string;
    }[];
  };
};
