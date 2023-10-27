import { Publication } from "./publication.model";

export interface Proceedings extends Publication {
  proceeding_id: number,
  editor: string,
  series: string,
  pages: string,
  month: string,
  organization: string,
  address: string,
  publisher: string,
}
