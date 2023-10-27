import { Publication } from "./publication.model";

export interface Thesis extends Publication {
  thesis_id: number,
  school: string,
  type: string,
  month: string,
  address: string
}
