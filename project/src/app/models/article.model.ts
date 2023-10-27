import { Publication } from "./publication.model";


export interface Article extends Publication {
  article_id: any,
  jurnal: string,
  number: number,
  volume: number,
  pages: string,
  month: string,

}
