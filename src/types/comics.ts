export type ComicImageSide = "cover" | "back";

export type ComicImage = {
  side: ComicImageSide;
  imageUrl: string | null;
  status: "approved" | "missing" | "pending";
};

export type ComicIssue = {
  id: string;
  issueSlug: string;
  title: string;
  series: string;
  publisher: string;
  issueNumber: string;
  year: number;
  coverDate: string;
  collection: string;
  box: string;
  grade: string;
  keyIssue: boolean;
  variant: boolean;
  signed: boolean;
  creators: string[];
  notes: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  images: ComicImage[];
};

export type ComicFilterState = {
  query?: string;
  publisher?: string;
  collection?: string;
  keyOnly?: boolean;
  missingOnly?: boolean;
};
