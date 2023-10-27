import { Publication } from "./publication.model";


export interface Other extends Publication {
  other_id?: any,
  subType: string,
  grantNumber: string,
  pages: string,
  month: string

}
