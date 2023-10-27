import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun
} from "docx";


const PHONE_NUMBER = "";
const PROFILE_URL = "";
const EMAIL = "";

export class DocumentCreator {
  // tslint:disable-next-line: typedef
  public create(
    userData: { firstName: string, lastName: string, email: string },
    educations: { school: string; endYear: string; title: any; }[],
    experiences: { title: string, company: string, startYear: string, endYear: string }[],
    publications: { title: string, year: string }[],
    organizations: { organization_id: any; name: string; description: string; }[],
    abilities: { keyword: string }[],
    interests: { keyword: string }[]): Document {


    const document = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: userData.firstName + " " + userData.lastName,
              heading: HeadingLevel.TITLE
            }),
            this.createContactInfo(PHONE_NUMBER, PROFILE_URL, userData.email),
            this.createHeading("Education"),
            ...educations
              .map((education: { school: string; endYear: string; title: any; }) => {
                const arr: Paragraph[] = [];
                arr.push(
                  this.createInstitutionHeader(
                    education.school,
                    `${education.endYear}`
                  )
                );
                arr.push(
                  this.createRoleText(
                    `${education.title}`
                  )
                );
                return arr;
              })
              .reduce((prev: string | any[], curr: any) => prev.concat(curr), []),
            this.createHeading("Experience"),
            ...experiences
              .map((experience: { title: string; company: string; startYear: string; endYear: string; }) => {
                const arr: Paragraph[] = [];
                arr.push(
                  this.createInstitutionHeader(
                    experience.company,
                    `${experience.startYear} - ${experience.endYear}`,
                  )
                );
                arr.push(
                  this.createRoleText(
                    `${experience.title}`
                  )
                );
                return arr;
              })
              .reduce((prev: string | any[], curr: any) => prev.concat(curr), []),


            this.createHeading("Publications"),
            ...publications
              .map((publication: { title: string; year: string; }) => {
                const arr: Paragraph[] = [];
                arr.push(
                  this.createInstitutionHeader(
                    publication.title,
                    publication.year ? `${publication.year}` : ''
                  )
                );
                return arr;
              })
              .reduce((prev: string | any[], curr: any) => prev.concat(curr), []),



            this.createHeading("Organizations"),
            this.createOrganizationList(organizations),



            this.createHeading("Skills, Achievements and Interests"),
            this.createSubHeading("Skills"),
            this.createSkillList(abilities),
            this.createSubHeading("Interests"),
            this.createInterests(interests)
          ]
        }
      ]
    });

    return document;
  }

  public createContactInfo(
    phoneNumber: string,
    profileUrl: string,
    email: string
  ): Paragraph {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun(
          `Mobile: ${phoneNumber} | LinkedIn: ${profileUrl} | Email: ${email}`
        )
      ]
    });
  }

  public createHeading(text: string): Paragraph {
    return new Paragraph({
      text: text,
      heading: HeadingLevel.HEADING_1,
      thematicBreak: true
    });
  }

  public createSubHeading(text: string): Paragraph {
    return new Paragraph({
      text: text,
      heading: HeadingLevel.HEADING_2
    });
  }

  public createInstitutionHeader(
    institutionName: string,
    dateText: string
  ): Paragraph {
    return new Paragraph({
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: TabStopPosition.MAX
        }
      ],
      children: [
        new TextRun({
          text: institutionName,
          bold: true
        }),
        new TextRun({
          text: `\t${dateText}`,
          bold: true
        })
      ]
    });
  }

  public createRoleText(roleText: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: roleText,
          italics: true
        })
      ]
    });
  }

  public createBullet(text: string): Paragraph {
    return new Paragraph({
      text: text,
      bullet: {
        level: 0
      }
    });
  }

  // tslint:disable-next-line:no-any
  public createSkillList(skills: any[]): Paragraph {
    return new Paragraph({
      children: [new TextRun(skills.map(skill => skill.keyword).join(", ") + ".")]
    });
  }

  public createOrganizationList(skills: any[]): Paragraph {
    return new Paragraph({
      children: [new TextRun(skills.map(skill => skill.name).join(", ") + ".")]
    });
  }

  // tslint:disable-next-line:no-any
  public createAchivementsList(achivements: any[]): Paragraph {
    return new Paragraph({
      children: [new TextRun(achivements.map(achivement => achivement.keyword).join(", ") + ".")]
    });
  }

  public createInterests(interests: any[]): Paragraph {
    return new Paragraph({
      children: [new TextRun(interests.map(interest => interest.keyword).join(", ") + ".")]
    });
  }

  public splitParagraphIntoBullets(text: string): string[] {
    return text.split("\n\n");
  }

  // tslint:disable-next-line:no-any
  public createPositionDateText(
    startDate: any,
    endDate: any,
    isCurrent: boolean
  ): string {
    const startDateText =
      this.getMonthFromInt(startDate.month) + ". " + startDate.year;
    const endDateText = isCurrent
      ? "Present"
      : `${this.getMonthFromInt(endDate.month)}. ${endDate.year}`;

    return `${startDateText} - ${endDateText}`;
  }

  public getMonthFromInt(value: number): string {
    switch (value) {
      case 1:
        return "Jan";
      case 2:
        return "Feb";
      case 3:
        return "Mar";
      case 4:
        return "Apr";
      case 5:
        return "May";
      case 6:
        return "Jun";
      case 7:
        return "Jul";
      case 8:
        return "Aug";
      case 9:
        return "Sept";
      case 10:
        return "Oct";
      case 11:
        return "Nov";
      case 12:
        return "Dec";
      default:
        return "N/A";
    }
  }
}
