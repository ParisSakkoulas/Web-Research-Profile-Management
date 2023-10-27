import { Book } from "./book.model";
import { Conference } from "./conference.model";
import { Journal } from "./journal.model";


export interface PublicationPlace {
  publication_place_id: string,
  name: string,
  type: string
}


export type PublicationPlaceType = PublicationPlace | Journal | Conference | Book

