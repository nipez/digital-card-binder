import Image from "next/image";

type PackagingImage = {
  src: string;
  alt: string;
  label: string;
};

const packagingImages: PackagingImage[] = [
  {
    src: "/set-media/1989-upper-deck-baseball/box-front.avif",
    alt: "1989 Upper Deck Baseball box front",
    label: "Box front"
  },
  {
    src: "/set-media/1989-upper-deck-baseball/box-back.avif",
    alt: "1989 Upper Deck Baseball box back",
    label: "Box back"
  }
];

export function SetPackaging() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {packagingImages.map((image) => (
        <figure key={image.src} className="overflow-hidden rounded-lg border border-white/70 bg-white/60 shadow-sm">
          <div className="relative aspect-[4/3] bg-archive-paper">
            <Image src={image.src} alt={image.alt} fill className="object-cover" sizes="(min-width: 1280px) 220px, 50vw" />
          </div>
          <figcaption className="px-3 py-2 text-xs font-bold uppercase text-archive-ink/58">{image.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
