import { PublicationPlace } from "./publication.place.model";


export interface Journal extends PublicationPlace {
  journal_id: string,
  abbrevation: string,
  publisher: number
}
