import { Article } from "src/app/models/article.model";
import { Book } from "src/app/models/book.model";
import { BookChapter } from "src/app/models/bookChapter.model";
import { ExternalReference } from "src/app/models/externalReference.model";
import { Proceedings } from "src/app/models/proceedings.model";
import { Publication } from "src/app/models/publication.model";
import { TechReport } from "src/app/models/techReport.model";
import { Thesis } from "src/app/models/thesis.model";


export interface PublicationState {
  publications: (Publication | Article | Book | Proceedings | Thesis | BookChapter | TechReport)[];
  references: ExternalReference[];
  error: string | null;
  status: 'pending' | 'loading' | 'error' | 'success';
}

export const initialState: PublicationState = {
  publications: [],
  references: [],
  error: null,
  status: 'pending'
}
