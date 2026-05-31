export type CardImageSide = "front" | "back";

export type CardImage = {
  side: CardImageSide;
  imageUrl: string | null;
  status: "approved" | "missing" | "pending";
  contributorName?: string | null;
};

export type Card = {
  id: string;
  setId: string;
  number: number;
  playerName: string;
  team: string;
  teamSlug: string;
  cardSlug: string;
  position: string;
  isRookie: boolean;
  isHallOfFamer: boolean;
  notes?: string;
  images: CardImage[];
};

export type SetSummary = {
  id: string;
  name: string;
  slug: string;
  year: number;
  manufacturer: string;
  totalCards: number;
  description: string;
};

export type FilterState = {
  team?: string;
  query?: string;
  rookieOnly?: boolean;
  hofOnly?: boolean;
  missingOnly?: boolean;
};

export type CollectionAction = "had" | "have" | "want" | "favorite";

export type ScanSubmission = {
  id: string;
  cardName: string;
  side: CardImageSide;
  contributor: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  imageUrl: string;
};
