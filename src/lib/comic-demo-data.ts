import type { ComicIssue } from "@/types/comics";
import { slugify } from "@/lib/utils";

const rawIssues = [
  ["Amazing Spider-Man", "Marvel", "300", 1988, "May 1988", "Wall-Crawler Keys", "Longbox A", "8.5", true, false, false, ["David Michelinie", "Todd McFarlane"], "A landmark late-eighties key with a bold first-cover energy.", "#1e4f7a", "#d13f32", "#f6d34b"],
  ["Batman", "DC", "423", 1988, "Sep 1988", "Gotham Shelf", "Longbox B", "9.0", true, false, false, ["Jim Starlin", "Todd McFarlane"], "A moody display issue that deserves a front-and-back archive slot.", "#151923", "#4c6f8f", "#d8b66a"],
  ["Uncanny X-Men", "Marvel", "266", 1990, "Aug 1990", "Mutant Milestones", "Longbox A", "7.5", true, false, false, ["Chris Claremont", "Mike Collins"], "A key mutant appearance tracked with scan completion and notes.", "#43266f", "#c83858", "#f2c14e"],
  ["Spawn", "Image", "1", 1992, "May 1992", "Image Launches", "Longbox C", "9.2", true, false, false, ["Todd McFarlane"], "A launch-era Image issue with creator-owned shelf appeal.", "#1c1b1a", "#2f8758", "#d5402b"],
  ["The Walking Dead", "Image", "19", 2005, "Jun 2005", "Modern Keys", "Longbox C", "8.0", true, false, false, ["Robert Kirkman", "Charlie Adlard"], "Modern key tracking for community-submitted cover scans.", "#2b2c2a", "#7d1f2f", "#d7d0bf"],
  ["Saga", "Image", "1", 2012, "Mar 2012", "Modern Keys", "Longbox D", "9.4", true, false, false, ["Brian K. Vaughan", "Fiona Staples"], "A modern first issue example for creator and publisher filtering.", "#153f52", "#d6744f", "#f0d68a"],
  ["Watchmen", "DC", "1", 1986, "Sep 1986", "Prestige Reads", "Longbox B", "8.0", true, false, false, ["Alan Moore", "Dave Gibbons"], "A prestige-format classic for the reader-owned archive view.", "#f0c438", "#321d1a", "#e84c3d"],
  ["Teenage Mutant Ninja Turtles", "Mirage", "1", 1984, "May 1984", "Indie Grails", "Vault Box", "6.0", true, false, false, ["Kevin Eastman", "Peter Laird"], "A grail placeholder where provenance and scan rights matter.", "#1d342f", "#8eb34f", "#d94b3d"],
  ["Ms. Marvel", "Marvel", "1", 2014, "Feb 2014", "Modern Keys", "Longbox D", "9.0", true, false, false, ["G. Willow Wilson", "Adrian Alphona"], "A modern hero launch with series and collection grouping.", "#284b76", "#b62e3a", "#f2dd7e"],
  ["Bone", "Cartoon Books", "1", 1991, "Jul 1991", "Indie Grails", "Vault Box", "7.0", true, false, false, ["Jeff Smith"], "Indie issue metadata shows the archive can stretch beyond the big two.", "#f8f4df", "#202020", "#dfb146"],
  ["Daredevil", "Marvel", "168", 1981, "Jan 1981", "Street-Level Keys", "Longbox E", "7.5", true, false, false, ["Frank Miller"], "First-appearance tracking with front and back cover completion.", "#7a181e", "#111111", "#e2c057"],
  ["Batman Adventures", "DC", "12", 1993, "Sep 1993", "Gotham Shelf", "Longbox B", "8.5", true, false, false, ["Kelley Puckett", "Mike Parobeck"], "Animated-era key issue example for a curated collection shelf.", "#25255b", "#d64633", "#f6d46a"]
] as const;

export const demoComicIssues: ComicIssue[] = rawIssues.map(
  ([series, publisher, issueNumber, year, coverDate, collection, box, grade, keyIssue, variant, signed, creators, notes, primary, secondary, accent], index) => {
    const issueSlug = `${slugify(series)}-${slugify(issueNumber)}`;
    const hasCover = index % 5 !== 4;
    const hasBack = index % 4 !== 3;

    return {
      id: issueSlug,
      issueSlug,
      title: `${series} #${issueNumber}`,
      series,
      publisher,
      issueNumber,
      year,
      coverDate,
      collection,
      box,
      grade,
      keyIssue,
      variant,
      signed,
      creators: [...creators],
      notes,
      palette: { primary, secondary, accent },
      images: [
        { side: "cover", status: hasCover ? "approved" : "missing", imageUrl: null },
        { side: "back", status: hasBack ? "approved" : "missing", imageUrl: null }
      ]
    };
  }
);

export function getComicIssueBySlug(issueSlug: string) {
  return demoComicIssues.find((issue) => issue.issueSlug === issueSlug);
}

export function getComicPublishers() {
  return Array.from(new Map(demoComicIssues.map((issue) => [slugify(issue.publisher), issue.publisher])).entries()).map(([slug, name]) => ({
    slug,
    name,
    count: demoComicIssues.filter((issue) => slugify(issue.publisher) === slug).length
  }));
}

export function getComicCollections() {
  return Array.from(new Map(demoComicIssues.map((issue) => [slugify(issue.collection), issue.collection])).entries()).map(([slug, name]) => ({
    slug,
    name,
    count: demoComicIssues.filter((issue) => slugify(issue.collection) === slug).length
  }));
}

export function comicHasMissingScan(issue: ComicIssue) {
  return issue.images.some((image) => image.status === "missing");
}
