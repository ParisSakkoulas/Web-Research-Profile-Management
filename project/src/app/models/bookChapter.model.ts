import { Publication } from "./publication.model";

export interface BookChapter extends Publication {
  book_chapter_id: number,
  chapter: string,
  publisher: string,
  pages: string,
  volume: string,
  series: string,
  type: string,
  month: string,
  address: string,
  version: string,
}
