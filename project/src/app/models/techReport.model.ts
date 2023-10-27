import { Publication } from "./publication.model";

export interface TechReport extends Publication {
  tech_report_id: number,
  address: string,
  month: string,
  number: string,
  type: string,
  tech_report_year: string,
  institution: string
}
