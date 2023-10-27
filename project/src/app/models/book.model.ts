import { Publication } from "./publication.model";
import { PublicationPlace } from "./publication.place.model";

export interface Book extends Publication {
  book_id: number,
  publisher: string,
  volume: number,
  series: string,
  pages: string,
  month: string,
  address: string,
  version: string,
  publication_place_id?: string,
  name?: string,
  type?: string

}
