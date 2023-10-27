import { PublicationPlace } from "./publication.place.model";


export interface Conference extends PublicationPlace {
  publication_place_id: string,
  abbrevation: string
}
