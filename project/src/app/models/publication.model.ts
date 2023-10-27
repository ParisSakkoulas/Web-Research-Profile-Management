import { Article } from "./article.model";
import { Book } from "./book.model";
import { BookChapter } from "./bookChapter.model";
import { Other } from "./other.model";
import { Proceedings } from "./proceedings.model";
import { PublicationPlace } from "./publication.place.model";
import { Tag } from "./tag.model";
import { TechReport } from "./techReport.model";
import { Thesis } from "./thesis.model";

export interface Publication {
  publication_id: any | null,
  userId: number | null,
  title: string,
  section: string,
  abstract: string,
  isbn: string,
  doi: string,
  year: string,
  accessibility: string,
  tags: Tag[],
  authors?: { id: any, firstName: string, lastName: string }[];
  exreferences?: { externalPublication_id: any, title: string, year: string, link: string }[]
  inreferences?: { publication_id: any, title: string, year: string },
  publicationPlace?: PublicationPlace;
  notes: string,
  references: string[]

}


export type PublicationType = Publication | Article | Book | Proceedings | Thesis | BookChapter | TechReport | Other;
