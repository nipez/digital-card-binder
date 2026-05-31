import type { Metadata } from "next";
import { ComicArchiveClient } from "@/components/ComicArchiveClient";
import { demoComicIssues, getComicCollections, getComicPublishers } from "@/lib/comic-demo-data";

export const metadata: Metadata = {
  title: "Comic Library | Binder Archive",
  description: "A v2 Binder Archive prototype for comic book collections, longboxes, cover scans, and issue detail views."
};

export default function ComicsPage() {
  return <ComicArchiveClient issues={demoComicIssues} publishers={getComicPublishers()} collections={getComicCollections()} />;
}
