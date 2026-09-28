/** Bilder liegen in /public/images – in der Vorschau relativ zur Seite */
export const imageUrl = (name: string) => `${process.env.NEXT_PUBLIC_ASSET_BASE ?? "/"}images/${name}`;
