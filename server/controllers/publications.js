

const Publication = require("../models/Publication/Publication");
const Tag = require("../models/Tag");
const ExternalReference = require("../models/ExternalReference");
const Article = require("../models/Publication/Article");
const Proceeding = require("../models/Publication/Proceedings");
const User = require("../models/User");
const File = require("../models/File");
const path = require('path');

//to find external publications
const cheerio = require("cheerio")
const scholarly = require("scholarly");
const axios = require("axios");
const Book = require("../models/Publication/Book");
const Thesis = require("../models/Publication/Thesis");
const ChapterBk = require("../models/Publication/BookChapter");
const TechReport = require("../models/Publication/TechnicalReport");
const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch("YOURSERPAPIKEY");
const ExternalPublication = require("../models/ExternalReference");
const fs = require('fs');
const fsExtra = require('fs-extra');

const xml2js = require('xml2js');

const { Sequelize, Op } = require('sequelize');
const { response } = require("express");
const Category = require("../models/Publication/Category");
const Other = require("../models/Publication/Other");
const PublicationStats = require("../models/Publication/PublicationStats");
const InternalReference = require("../models/Publication/InternalReference");
const PresentantionFile = require("../models/Files/PresentantionFile");
const ContentFile = require("../models/Files/ContentFile");
const ExternalAuthor = require("../models/ExternalAuthor");
const PublicationPlace = require("../models/Publication/PublicationPlace");
const PublicationsPerYear = require("../models/Profile/PublicationsPerYear");
const Profile = require("../models/Profile/Profile");
const Network = require("../models/Profile/Networks");
const RequestFile = require("../models/Files/RequestFile");
const Notification = require("../models/Notification");



Sequelize.Op = Op;
const operatorsAliases = {
  $like: Op.like,
  $not: Op.not
}


//Μέθοδος που χρησιμοποιούμε για την αφαίρεση των διπλώτυπων απο έναν πίνακα
const removeDuplicatesAndTrim = (array) => {
  return array.filter((item, index) => {
    return array.map(item => item.trim()).indexOf(item.trim()) === index;
  });
};



// Μέθοδος που δέχεται ως παράμετρο τον τίτλο μιας δημοσίευσης και το λινκ και βρίσκει τον ολοκληρωμένο τίτλο μέσω του λινκ
async function findFullTitle(title, link) {

  console.log("FindFullTitle found")

  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36";

  const normalizeText = s =>
    s.toLowerCase()
      .replace(/[^a-z]/g, " ")
      .replace(/\s+/, " ")
      .trim();


  const normalizedTitle = normalizeText(title);

  try {
    const { data } = await axios.get(link, { headers: { "User-Agent": ua } });
    const $ = cheerio.load(data);
    return [...$("*")] // Επέλεξε όλα τα αντικείμενα στην html και βάλτα σε πίνακα
      .flatMap(e =>
        [...$(e).contents()].filter(e => e.type === "text") //Αφαίρεση όλων των αντικειμένων της html που δεν περιέχουν text
      )
      .map(e => $(e).text().trim())
      .filter(Boolean)
      .find(e => normalizeText(e).startsWith(normalizedTitle));
  }
  catch (err) {
    return title;
  }
}


//Μέθοδος που δέχεται σαν παράμετρο ένα publication object και το αποθηκεύει στην βάση δεδομένων
async function savePublication(publication, userData, response) {
  try {
    const createdPublication = await Publication.create(publication, { include: [Article, Book, Proceeding, Thesis, ChapterBk, TechReport] });


    // Find the user from the database based on the userData object stored in the request
    const userCreator = await User.findOne({ where: { user_id: userData.userId } });

    //add current as author
    await createdPublication.addInternalAuthors(userCreator);

    //αφού βρούμε τον χρήστη έπειτα συνδέουμε την συγκεκριμένη δημοσίευση με τον τρέχον χρήστη.
    await createdPublication.setUser(userCreator)


    //Δημιουργία αντικειμένου για στατιστικά
    const publicationStatsObj = {
      citations: 0,
      references: 0,
      num_of_exported_presentation_file: 0,
      num_of_exported_content_file: 0,
      reqs_of_exported_presentation_file: 0,
      reqs_of_exported_content_file: 0,
    }
    //Αποθήκευση αντικειμένου για στατιστικά στην Βάση
    const publicationStats = await PublicationStats.create(publicationStatsObj);
    //συσχέτιση αντικειμένου publicationStat με την Δημοσίευση που δημιουργήσαμε 
    await createdPublication.setPublicationStat(publicationStats);



    //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
    const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: userData.userId, state: 'All' } });
    const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: userData.userId, state: 'Uncategorized' } });

    //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
    createdPublication.addPublicationcategories(allCategoryFound);
    createdPublication.addPublicationcategories(uncategorizedFound);


    // Connect the created publication with the current user
    await createdPublication.setUser(userCreator);


    switch (publication.section) {


      case 'Article':

        let jurnalToSet;
        if (response.data.message['short-container-title'][0]) {
          jurnalToSet = response.data.message['short-container-title'][0];
        }
        else if (response.data.message['container-title'][0]) {
          jurnalToSet = response.data.message['container-title'][0];
        }
        else {
          jurnalToSet = ""
        }

        sectionCreated = {
          jurnal: jurnalToSet,
          number: response.data.message.issue ? response.data.message.issue : null,
          volume: response.data.message.volume ? response.data.message.volume : null,
          pages: response.data.message.page ? response.data.message.page : null,
          month: response.data.message.month ? response.data.message.month : 'Not Defined'
        }


        console.log(sectionCreated)


        console.log(sectionCreated)
        console.log(createdPublication)
        //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
        const article1 = await Article.create(sectionCreated)
        publicationType = article1;
        await createdPublication.setArticle(article1)
        sectionId = article1.article_id;

        break;

      case 'Book_Chapter':

        let chapterToSet;

        if (response.data.message['container-title']) {
          chapterToSet = response.data.message['container-title'][0]
        }
        else {
          chapterToSet = ""
        }

        sectionCreated = {
          chapter: chapterToSet,
          publisher: response.data.message.publisher ? response.data.message.publisher : "",
          pages: response.data.message.page ? response.data.message.page : "",
          volume: response.data.message['edition-number'] ? response.data.message['edition-number'] : null,
          series: response.data.message.series ? response.data.message.series : null,
          type: 'Book_Chapter'
        }
        console.log(sectionCreated)

        //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
        const bookCpt1 = await ChapterBk.create(sectionCreated)
        publicationType = bookCpt1;
        await createdPublication.setChapterBk(bookCpt1)
        sectionId = bookCpt1.book_chapter_id;
        break;

      case 'Book':

        let publisherToSet;
        if (response.data.message.publisher) {
          publisherToSet = response.data.message.publisher
        }
        else {
          publisherToSet = ""
        }

        console.log(response.data.message)
        sectionCreated = {
          publisher: publisherToSet,
          number: response.data.message.issue ? response.data.message.issue : null,
          volume: response.data.message.volume ? response.data.message.volume : null,
          pages: response.data.message.page ? response.data.message.pages : null,
          month: response.data.message.month ? response.data.message.month : 'Not Defined',
          series: response.data.message.series ? response.data.message.series : null,
          address: response.data.message.address ? response.data.message.address : null,
          version: response.data.message.version ? response.data.message.version : null,
        }
        console.log(sectionCreated)
        console.log(response.data.message.issued['date-parts']);

        //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
        const book1 = await Book.create(sectionCreated)
        publicationType = book1;
        await createdPublication.setBook(book1)
        sectionId = book1.book_id;
        break;


      case 'Proceedings':


        let monthToSet = 'Not Defined';
        if (response.data.message.published) {
          let monthNumber = response.data.message.published['date-parts'][0][1];

          switch (monthNumber) {

            case 1:
              monthToSet = 'January'
              break;

            case 2:
              monthToSet = 'February';
              break;
            case 3:
              monthToSet = 'March';
              break;
            case 4:
              monthToSet = 'April';
              break;
            case 5:
              monthToSet = 'May';
              break;
            case 6:
              monthToSet = 'June';
              break;
            case 7:
              monthToSet = 'July';
              break;
            case 8:
              monthToSet = 'August';
              break;
            case 9:
              monthToSet = 'September';
              break;
            case 10:
              monthToSet = 'October';
              break;
            case 11:
              monthToSet = 'November';
              break;
            case 12:
              monthToSet = 'December';
              break;

          }
        }


        let editorToSet;
        if (response.data.message.publisher) {
          editorToSet = response.data.message.publisher
        }
        else {
          editorToSet = ""
        }

        sectionCreated = {
          editor: editorToSet,
          number: response.data.message.issue ? response.data.message.issue : null,
          volume: response.data.message.volume ? response.data.message.volume : null,
          pages: response.data.message.page ? response.data.message.pages : null,
          month: monthToSet,
          organization: response.data.message.publisher ? response.data.message.publisher : null,
          address: response.data.message.event.location ? response.data.message.event.location : null,
          publisher: response.data.message.publisher ? response.data.message.publisher : null,
        }
        console.log(sectionCreated)
        console.log(response.data.message.issued['date-parts']);

        //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
        const proceeding1 = await Proceeding.create(sectionCreated)
        publicationType = proceeding1;
        await createdPublication.setProceeding(proceeding1)
        sectionId = proceeding1.proceeding_id;
        break;


      case 'Tech_Report':

        let institutionToSet;
        console.log(response.data.message)
        if (response.data.message.institution && response.data.message.institution.length > 0) {
          institutionToSet = response.data.message.institution[0]['name']
        }
        else {
          institutionToSet = ""
        }

        let monthToSett = "Not Defined";
        if (response.data.message.published['date-parts']) {
          let monthNumber = response.data.message.published['date-parts'][0][1];

          switch (monthNumber) {

            case 1:
              monthToSett = 'January'
              break;

            case 2:
              monthToSett = 'February';
              break;
            case 3:
              monthToSett = 'March';
              break;
            case 4:
              monthToSett = 'April';
              break;
            case 5:
              monthToSett = 'May';
              break;
            case 6:
              monthToSett = 'June';
              break;
            case 7:
              monthToSett = 'July';
              break;
            case 8:
              monthToSett = 'August';
              break;
            case 9:
              monthToSett = 'September';
              break;
            case 10:
              monthToSett = 'October';
              break;
            case 11:
              monthToSett = 'November';
              break;
            case 12:
              monthToSett = 'December';
              break;

          }
        }


        sectionCreated = {
          institution: institutionToSet,
          address: response.data.message['publisher-location'] ? response.data.message['publisher-location'] : null,
          month: monthToSett,
          tech_report_year: publication.year,
          type: response.data.message.type,
        }

        //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
        const techReport1 = await TechReport.create(sectionCreated)
        publicationType = techReport1;
        await createdPublication.setTechReport(techReport1)
        sectionId = techReport1.tech_report_id;

        console.log(sectionCreated)
        break;


      case 'Thesis':

        let schoolToSet;
        if (response.data.message.institution) {
          schoolToSet = response.data.message.institution[0]['name']
        }
        else {
          schoolToSet = ""
        }

        let degreeToSet = 'Other';
        if (response.data.message.degree) {
          if (response.data.message.degree[0].toLowerCase().includes('master')) {
            degreeToSet = 'Master'
          }
          else if (response.data.message.degree[0].toLowerCase().includes('phd')) {
            degreeToSet = 'PhD'
          }
          else {
            degreeToSet = 'Other';
          }
        }


        console.log(response.data.message.deposited['date-parts']);

        let monthToSet2 = 'Not Defined';
        if (response.data.message.deposited) {
          let monthNumber = response.data.message.deposited['date-parts'][0][1];

          switch (monthNumber) {

            case 1:
              monthToSet2 = 'January'
              break;

            case 2:
              monthToSet2 = 'February';
              break;
            case 3:
              monthToSet2 = 'March';
              break;
            case 4:
              monthToSet2 = 'April';
              break;
            case 5:
              monthToSet2 = 'May';
              break;
            case 6:
              monthToSet2 = 'June';
              break;
            case 7:
              monthToSet2 = 'July';
              break;
            case 8:
              monthToSet2 = 'August';
              break;
            case 9:
              monthToSet2 = 'September';
              break;
            case 10:
              monthToSet2 = 'October';
              break;
            case 11:
              monthToSet2 = 'November';
              break;
            case 12:
              monthToSet2 = 'December';
              break;

          }
        }
        sectionCreated = {
          school: schoolToSet,
          type: degreeToSet,
          month: monthToSet2,
          address: response.data.message.publisher ? response.data.message.publisher : null,

        }

        //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
        const thesis1 = await Thesis.create(sectionCreated)
        publicationType = thesis1;
        await createdPublication.setThesis(thesis1)
        sectionId = thesis1.thesis_id;

        console.log(sectionCreated);
        break;


      default:

        sectionCreated = {
          publisher: response.data.message.publisher ? response.data.message.publisher : null,
          type: response.data.message.type
        }
        console.log(sectionCreated)
        break;
    }


    return createdPublication; // Return the createdPublication object
  } catch (error) {
    throw error; // Throw the error to be caught in the calling function
  }
}







exports.add_single_publication = async (req, res, next) => {


  let publicationType = {}

  console.log(req.contentFile)
  const sectionObj = JSON.parse(req.body.publication);
  console.log(sectionObj);
  //Δημιουργία αντικειμένου με τα δεδομένα που στέλνει ο client στο body
  const publication = {
    title: sectionObj.title,
    section: sectionObj.section,
    abstract: sectionObj.abstract,
    isbn: sectionObj.isbn,
    doi: sectionObj.doi,
    year: sectionObj.year,
    notes: sectionObj.notes,
    accessibility: sectionObj.accessibility
  }


















  //Έλεγχος DOI και ISBN με βάση τα regex τους αντίστοιχα
  const isbnRegex = /^\d{10}$|^\d{13}$/;
  const doiRegex = /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/;

  if (sectionObj.isbn && !isbnRegex.test(sectionObj.isbn)) {

    return res.status(200).json({
      message: "ISBN number should be 10 or 13 digits long"
    })

  }

  if (sectionObj.doi && !doiRegex.test(sectionObj.doi)) {

    return res.status(200).json({
      message: "DOI number should have this shape : ex. 10.1093/ajae/aaq063"
    })

  }

  //Δημιουργία αντικειμένου Publication στην βάση δεδομένων με βάση το αντικείμενο publication
  /*Publication.create(publication).then(async createdPublication => {

    //Βρίσκουμε τον χρήστη από την βάση. Με την βοήθεια του αντικειμένου userData που είναι αποθηκευμένο στο request.
    const userCreator = await User.findOne({ where: { user_id: req.userData.userId } });
    //αφού βρούμε τον χρήστη έπειτα συνδέουμε την συγκεκριμένη δημοσίευση με τον τρέχον χρήστη.
    await createdPublication.setUser(userCreator)

  })*/

  //Δημιουργία αντικειμένου Publication στην βάση δεδομένων με βάση το αντικείμενο publication
  const createdPublication = await Publication.create(publication, { include: Article, Book, Proceeding, Thesis, ChapterBk, TechReport, Other }).catch(err => {

    res.status(500).json({
      message: "Error while creating the publication",
      error: err.message
    })

  });

  console.log(createdPublication)


  //Βρίσκουμε τον χρήστη από την βάση. Με την βοήθεια του αντικειμένου userData που είναι αποθηκευμένο στο request.
  const userCreator = await User.findOne({ where: { user_id: req.userData.userId } }).catch(err => {

    res.status(500).json({
      message: "Error while finding the user",
      error: err.message
    })

  });;

  console.log(userCreator);

  const followers = await userCreator.getFollowers();

  if (followers.length > 0) {

    for (let follower of followers) {
      let notification = {
        type: 'User Upload Publication',
        title: `${userCreator.firstName} ${userCreator.lastName} just publish a paper ${createdPublication.title}`,
        status: 'Unread',
        userToNotify: follower.user_id,
        userCreator: userCreator.user_id,
      }


      await Notification.create(notification);

    }


  }

  //αφού βρούμε τον χρήστη έπειτα συνδέουμε την συγκεκριμένη δημοσίευση με τον τρέχον χρήστη.
  await createdPublication.setUser(userCreator).catch(err => {

    res.status(500).json({
      message: "Error setting the user to publication",
      error: err.message
    })

  });;


  //παίρνουμε το user id
  const userId = userCreator.user_id;
  //Αρχικά παίρνουμε το contentFile αν υπάρχει τότε δημιουργούμε το αντίστοιχο αντικείμενο, το αποθηκεύουμε στην βάση και κάνουμε την συσχέτιση με την Δημοσίευση
  if (req.files['contentFile']) {

    const contentFile = req.files['contentFile'][0];
    const folderPath = './uploads/' + userId;
    const fileName = contentFile.originalname;
    const filePath = folderPath + '/' + fileName;
    const file = contentFile;
    const targetDirectory = `./uploads/${userId}/${createdPublication.publication_id}/${createdPublication.accessibility}`;
    const targetPath = `${targetDirectory}/${file.originalname}`;


    //Δημιουργία αντικειμένου
    const fileObj = {
      filename: fileName,
      type: path.extname(filePath),
      path: targetPath,
      access: createdPublication.accessibility
    }

    //Αποθήκευση αντικειμένου ContentFile
    const contentFileCreated = await ContentFile.create(fileObj);
    //Συσχέτιση Δημοσίευσης με το αρχείο
    await createdPublication.addContentFile(contentFileCreated);

    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, { recursive: true });
    }

    fs.renameSync(file.path, targetPath);

  }


  if (req.files['presentantionFile']) {

    const presentantionFile = req.files['presentantionFile'][0];
    const folderPath = './uploads/' + userId;
    const fileName = presentantionFile.originalname;
    const filePath = folderPath + '/' + fileName;
    const file = presentantionFile;
    const targetDirectory = `./uploads/${userId}/${createdPublication.publication_id}/${createdPublication.accessibility}`;
    const targetPath = `${targetDirectory}/${file.originalname}`;

    //Δημιουργία αντικειμένου
    const fileObj = {
      filename: fileName,
      type: path.extname(filePath),
      path: targetPath,
      access: createdPublication.accessibility
    }

    //Αποθήκευση αντικειμένου ContentFile
    const presentantionFileCreated = await PresentantionFile.create(fileObj);
    //Συσχέτιση Δημοσίευσης με το αρχείο
    await createdPublication.addPresentantionFile(presentantionFileCreated);

    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, { recursive: true });
    }

    fs.renameSync(file.path, targetPath);

  }


  //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
  const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
  const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

  //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
  createdPublication.addPublicationcategories(allCategoryFound);
  createdPublication.addPublicationcategories(uncategorizedFound);


  //Δημιουργία αντικειμένου για στατιστικά
  const publicationStatsObj = {
    citations: 0,
    references: 0,
    num_of_exported_presentation_file: 0,
    num_of_exported_content_file: 0,
    reqs_of_exported_presentation_file: 0,
    reqs_of_exported_content_file: 0,
  }
  //Αποθήκευση αντικειμένου για στατιστικά στην Βάση
  const publicationStats = await PublicationStats.create(publicationStatsObj);
  //συσχέτιση αντικειμένου publicationStat με την Δημοσίευση που δημιουργήσαμε 
  await createdPublication.setPublicationStat(publicationStats);






  //Έλεγχγος αν στέλνονται authors μαζί με το αντικείμενο section obj
  if (sectionObj.authors) {

    //Αρχικά διατρέχουμε τον πίνακα με του συγγραφείς. Ελέγχουμε αν ο εκάστωτε συγγραφέας
    // είναι εσωτερικό ή εξωτερικό και κάνουμε την αντίστοιχη συσχέτιση
    for (let author of sectionObj.authors) {

      //Εσωτερικός
      if (author.type === 'Internal') {

        //Εύρεση εσωτερικού χρήστη
        const internalAuthorFound = await User.findByPk(Number(author.id));


        //συσχέτιση χρήστη με την δημοσίευση ως συγγραφέα
        if (internalAuthorFound) {

          await createdPublication.addInternalAuthors(internalAuthorFound);

        }

      }

      //Εξωτερικός
      else if (author.type === 'External') {
        //Εύρεση Εξωτερικού χρήστη
        const externalAuthorFound = await ExternalAuthor.findByPk(Number(author.id));
        //συσχέτιση χρήστη με την δημοσίευση ως συγγραφέα
        if (externalAuthorFound) {
          await createdPublication.addExternalAuthors(externalAuthorFound);
        }

      }

    }



  }


  ///Έλεγχος αν υπάρχει publication place μαζί με το αντικείμενο section obj
  if (sectionObj.publicationPlace) {

    //Εύρεση αντικειμένου Τόπου και συσχέτιση αυτού με την δημοσίευση
    const publicationPlaceFound = await PublicationPlace.findByPk(sectionObj.publicationPlace.publication_place_id);
    if (publicationPlaceFound) {
      await publicationPlaceFound.addPublications(createdPublication);

    }

  }



  //Αρχικά θα ελέγχουμε το section που έχει η συγκεκριμένη Δημοσίευση που δημιουργούμε
  //Σε περίπτωση που γίνεται προσθήκης Άρθρου
  if (sectionObj.section === 'Article') {
    const article = {
      jurnal: sectionObj.jurnal,
      number: sectionObj.number,
      volume: sectionObj.volume,
      pages: sectionObj.pages,
      month: sectionObj.month
    }

    //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
    const article1 = await Article.create(article).catch(err => {

      res.status(500).json({
        message: "Error on setting the Article to Publication",
        error: err.message
      })

    });
    publicationType = article1;
    await createdPublication.setArticle(article1)
    sectionId = article1.article_id;
  }

  //Σε περίπτωση που γίνεται προσθήκης Book
  else if (sectionObj.section === 'Book') {

    const book = {
      publisher: sectionObj.publisher,
      volume: sectionObj.volume,
      series: sectionObj.series,
      pages: sectionObj.pages,
      month: sectionObj.month,
      address: sectionObj.address,
      version: sectionObj.version,

    }

    //εισαγωγή αντικειμένου στον πίνακα Book και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που δημιουργείται αρχικ
    const book1 = await Book.create(book).catch(err => {

      res.status(500).json({
        message: "Error on setting the Book to Publication",
        error: err.message
      })

    });
    publicationType = book1;
    await createdPublication.setBook(book1)
    sectionId = book1.book_id;
  }

  //Σε περίπτωση που γίνεται προσθήκης Proceedings
  else if (sectionObj.section === 'Proceedings') {

    const proceeding = {
      editor: sectionObj.editor,
      series: sectionObj.series,
      pages: sectionObj.pages,
      month: sectionObj.month,
      organization: sectionObj.organization,
      address: sectionObj.address,
      publisher: sectionObj.publisher,

    }

    const proceeding1 = await Proceeding.create(proceeding).catch(err => {

      res.status(500).json({
        message: "Error on setting the Proceeding to Publication",
        error: err.message
      })

    });
    publicationType = proceeding1;
    await createdPublication.setProceeding(proceeding1)
    sectionId = proceeding1.proceeding_id;
    console.log(sectionId);



  }


  //Σε περίπτωση που γίνεται προσθήκης Διατριβής
  else if (sectionObj.section === 'Thesis') {
    console.log(sectionObj.section);
    const thesis = {
      school: sectionObj.school,
      type: sectionObj.type,
      month: sectionObj.month,
      address: sectionObj.address
    }
    console.log(thesis);
    //εισαγωγή αντικειμένου στον πίνακα Book και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που δημιουργείται αρχικά
    const thesis1 = await Thesis.create(thesis).catch(err => {

      res.status(500).json({
        message: "Error on setting the Thesis to Publication",
        error: err.message
      })

    });
    publicationType = thesis1;
    await createdPublication.setThesis(thesis1)
    sectionId = thesis1.thesis_id;
    console.log(thesis1)



  }

  //Σε περίπτωση που γίνεται προσθήκης Κεφάλαιου Βιβλίου
  else if (sectionObj.section === 'Book_Chapter') {

    const book_chapter = {

      chapter: sectionObj.chapter,
      publisher: sectionObj.publisher,
      pages: sectionObj.pages,
      volume: sectionObj.volume,
      series: sectionObj.series,
      type: sectionObj.type,
      month: sectionObj.month,
      address: sectionObj.address,
      version: sectionObj.version,

    }

    console.log(book_chapter)

    //εισαγωγή αντικειμένου στον πίνακα Book και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που δημιουργείται αρχικά
    const book_chapter1 = await ChapterBk.create(book_chapter).catch(err => {

      res.status(500).json({
        message: "Error on setting the Chapter Book to Publication",
        error: err.message
      })

    });
    publicationType = book_chapter1;
    await createdPublication.setChapterBk(book_chapter1)
    sectionId = book_chapter1.book_chapter_id;

  }

  //Σε περίπτωση που γίνεται προσθήκης Τεχνηκής Αναφοράς
  else if (sectionObj.section === 'Tech_Report') {

    const techReport = {
      address: sectionObj.address,
      month: sectionObj.month,
      number: sectionObj.number,
      type: sectionObj.type,
      tech_report_year: sectionObj.tech_report_year,
      institution: sectionObj.institution

    }

    //εισαγωγή αντικειμένου στον πίνακα TechReport και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που δημιουργείται αρχικά
    const techReport1 = await TechReport.create(techReport).catch(err => {

      res.status(500).json({
        message: "Error on setting the Tech Report to Publication",
        error: err.message
      })

    });
    publicationType = techReport1;
    await createdPublication.setTechReport(techReport1)
    sectionId = techReport1.tech_report_id;

  }


  else if (sectionObj.section === 'Other') {

    const other = {
      subType: sectionObj.subType,
      grantNumber: sectionObj.grantNumber,
      month: sectionObj.month,
      pages: sectionObj.pages,

    }

    //εισαγωγή αντικειμένου στον πίνακα TechReport και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που δημιουργείται αρχικά
    const other1 = await Other.create(other).catch(err => {

      res.status(500).json({
        message: "Error on setting the Tech Report to Publication",
        error: err.message
      })

    });

    publicationType = other1;
    await createdPublication.setOther(other1)
    sectionId = other1.other_id;

  }

  console.log(createdPublication.publication_id)

  const publicationWithTypeIncluded = await Publication.findByPk(createdPublication.publication_id, {
    include: [
      { model: Article },
      { model: Book },
      { model: Proceeding },
      { model: ChapterBk },
      { model: Thesis },
      { model: TechReport }


    ]
  });


  console.log("With type", publicationWithTypeIncluded)

  //Σε περίπτωση που γίνει εισαγωγή γενικού τύπου Δημοσίευσης





  /*
    Παρακάτω έχουμε την διαχείριση των τάγκς για μια δημοσίευση. Αρχικά τοποθετούμε τα tags σε ένα copy array.
    Έπειτα διατρέχουμε τον πίνακα για να πάρουμε μόνο τα keywords δηλ. τα strings απο κάθε ταγκ. Μετά τα προσθέτουμε
    σε έναν πίνακα tags. Αφού γεμίσουμε τον πίνακα tags το διατρέχουμε και ψάχνουμε αν υπάρχει το συγκεκριμένο ταγκ στη βάση.
    Αν υπάρχει τότε το συσχετίζουμε με την δημοσίευση που δημιουργήσαμε πιο πάνω. Διαφορετικά αν δεν υπάρχει δημιουργούμε ένα
    αντικείμενο ταγκ το αποθηκεύουμε στη βάση και τέλος το συσχετίζουμε με την δημοσίευση που δημιουργήσαμε.
  */
  //τοποθετούμε τα tags που στέλνει ο client σε ένα copy πίνακα
  const tagBack = [...sectionObj.tags];

  //Έπειτα διατρέχουμε τον πίνακα για να πάρουμε μόνο τα keywords των tag και μετά τα προσθέτουμε σε έναν πίνακα tags
  let tags = [];
  console.log(tagBack.map(tag => {
    tags.push(tag.keyword)
  }))

  //Διατρέχουμε τον πίνακα των ταγκς που δημιουργήθηκε πιο πάνω
  for (let i = 0; i < tags.length; i++) {

    console.log("Searching for : ", tags[i])

    Tag.findAll({
      where: {
        keyword: tags[i]
      }
    }).then(tag => {

      if (tag.length >= 1) {
        createdPublication.addTag(tag)
        console.log("Found: ", tags[i])
      }

      else {
        Tag.create({

          keyword: tags[i]
        }).then(createdTag => {

          console.log("Create: ", tags[i])
          createdPublication.addTag(createdTag);

        })
      }

    })

  }
  let messageSend;

  /*Παρακάτω ελέγχουμε αν ο client στείλει και αναφορές για την συγκεκριμένη Δημοσίευση. Αρχικά
    ψάχνουμε στις εσωτερικές δημοσιεύσεις που έχουν εισαχθεί εντός του συστήματος. Αν υπάρχει στον πίνακα references που
    στέλνετε στο  body τότε το κάνουμε συσχέτιση. Αν δεν είναι από τις εσωτερικές δημοσιεύσεις των χρηστών τότε ψάχνουμε
    στις Εξωτερικές δημοσιεύσεις που έχει εισάγει το σύστημα(πιθανώς να έχουν χρησιμοποιηθεί ως αναφορές σε άλλες δημ και για αυτό το λόγο
    να είναι αποθηκευμένες) αν βρεθούν εκεί κάνουμε συσχέτιση. Διαφορετικά αν δεν βρεθούν ούτε εκεί, τότε σημαίνει ότι δεν είναι αποθηκευμένες
    στη βάση του συστήματος τότε θα ψάξουμε απο τις αντίστοιχες πηγές(Google Scholar, Dblp). Σε οποιαδήποτε απο τις παραπάνω περιπτώσεις βρεθούν
    πολλαπλές δημοσιεύσεις τότε στέλνονται στον client για να επιλέξει αυτός τις αναφορές που θέλει
  */
  if (sectionObj.references && sectionObj.references.length >= 1) {

    //τοποθετούμε τα references που στέλνει ο client σε ένα copy πίνακα
    const references = [...sectionObj.references];

    //έπειτα καλούμε την μέθοδο για αφαίρεση των διπλών εισαγωγών σε περίπτωση που ο χρήστης εισήγαγε καταλάθος πολλές φορές την ίδια αναφορά
    // Είναι πιθανό να γίνεται έλεγχος εξ αρχής στο frontend για να αποφεχθούν τα διπλότυπα
    const removedDuplicatedRefs = removeDuplicatesAndTrim(references);

    //δήλωση πίνακα που θα εισάγουμε εξωτερικές δημοσιεύσεις σε περιπτώσεις όπου τα αποτελέσματα αναζήτησης είναι μεγαλύτερα του 1
    let externalRefs = [];

    let queySearches = [];




    console.log(removedDuplicatedRefs);

    //Αρχικά ψάχνουμε εσωτερικά τις αναφορές στον πίνακα Publication
    const internalRefResult = await Publication.findAll({ where: { title: { [Sequelize.Op.in]: removedDuplicatedRefs } }, ignoreWhitespace: true }).catch(err => {

      res.status(500).json({
        message: "Error while fetching thePublication 's References",
        error: err.message
      })


    })
    console.log(internalRefResult.length, "INTERNAL SIZEEEEEEEEEEEEEEEEEEE");



    //Διατρέχουμε τον πίνακα με τα refs που στέλνει ο client
    for (let i = 0; i < removedDuplicatedRefs.length; i++) {

      //Αρχικά ψάχνουμε εσωτερικά τις αναφορές στον πίνακα Publication
      const internalRefResult = await Publication.findAll({ where: { title: { [Sequelize.Op.eq]: Sequelize.fn("TRIM", removedDuplicatedRefs[i]) } }, ignoreWhitespace: true }).catch(err => {

        res.status(500).json({
          message: "Error while fetching thePublication 's References",
          error: err.message
        })


      })


      ///Αν βρεθούν εσωτερικές δημοσιεύσεςι αρχικά τις διατρέχουμε παίρνουμε τα στατιστικά τους και εν συνεχεία αυξάνουμε κατα 1 το citation
      if (internalRefResult) {

        for (let p of internalRefResult) {
          const publicationStat = await p.getPublicationStat();
          publicationStat.increment('citations', { by: 1 });
          console.log(publicationStat);



        }

      }




      console.log(internalRefResult.length, "INTERNAL SIZEEEEEEEEEEEEEEEEEEE");

      //Αν το μέγεθος του internalRefResult είναι 1 σημαίνει ότι βρέθηκε Δημοσίευση εσωτερικά του συστήματος
      // οπότε κάνουμε την συσχέτιση με την δημοσίευση που δημιουργήθηκε πιο πάνω
      if (internalRefResult.length === 1) {
        await createdPublication.addReference(internalRefResult);

        const refs = await createdPublication.getReferences();
        console.log(refs)


      }

      /*  Σε διαφορετική περίπτωση σημαίνει ότι δεν βέθηκε εσωτερικά δημοσίευση με τον αντίστοιχο τίτλο,
          οπότε αρχικά θα ψάξουμε στον πίνακα external references στον οποίο αποθηκεύουμε τις δημοσιεύσεις που
          δεν είναι μέρος του συστήματος αλλά έχουν αναφερθεί απο άλλες δημοσιεύσεις στο παρελθόν και έχουν εισαχθεί από πηγές του διαδικτύου.
          */
      else {



        //Αρχικά ψάχνουμε εσωτερικά τις αναφορές στον πίνακα ExternalReference
        const externalRefResult = await ExternalReference.findAll({ where: { title: removedDuplicatedRefs[i] } }).catch(err => {
          res.status(500).json({
            message: "Error while fetching ExternalReferences",
            error: err.message
          })
        })



        //αν το μέγεθος του externalRefResult είναι 1 σημαίνει ότι βρέθηκε Δημοσίευση εσωτερικά του συστήματος
        if (externalRefResult.length === 1) {
          //αν βρεθεί εσωτερικά ο τίτλος τότε εκχωρούμε μια αναφορά με βάση την αρχική δημοσίευση που αναφέρεται στον τίτλο που βρέθηκε
          await createdPublication.addExreference(externalRefResult);
        }

        /* Αν δεν βρεθεί ο τίτλος ούτε στον πίνακα ExternalReference τότε σημαίνει ότι δεν υπάρχει εσωτερικά
            οπότε θα ψάξουμε απο πηγές στο ιντερνετ. (Google Scholar και DBPL)
        */
        else {


          const query = removedDuplicatedRefs[i];


          const params = {
            engine: "google_scholar",
            q: query
          }

          const getPublications = async (params) => {
            return new Promise((resolve, reject) => {
              search.json(params, async result => {
                const promises = result.organic_results.map(async publication => {
                  const yearPattern = /\d{4}/;
                  const yearMatch = publication.publication_info.summary.match(yearPattern);
                  const year = yearMatch ? yearMatch[0] : null;

                  const publicationToSend = {
                    title: publication.title.includes("…") ? await findFullTitle(publication.title, publication.link) : publication.title,
                    link: publication.link,
                    year: year
                  }

                  return publicationToSend;
                });


                const publicationsFromScholarSearch = await Promise.all(promises);

                //Αν το μέγεθος του πίνακα είναι ίσο με 1 τότε σημαίνει ότι βρέθηκε Δημοσίευση με τον ακριβώς ίδιο τίτλο. Οπότε απλώς κάνουμε τη συσχέτιση
                if (publicationsFromScholarSearch.length === 1) {
                  const externalPublicationCreated = await ExternalPublication.create(publicationsFromScholarSearch[0]);
                  await createdPublication.addExreference(externalPublicationCreated);
                  resolve();

                }

                //Αν το μέγεθος του πίνακα είναι μεγαλύτερο του 1 τότε σημαίνει ότι θα σταλούν όλες οι δημοσιεύσεις που βρέθηκαν σύμφωνα με το αντίστοιχο query
                else if (publicationsFromScholarSearch.length > 1) {
                  resolve(publicationsFromScholarSearch);
                }

                //Σε διαφορετική περίπτωση σημαίνει ότι το μέγεθος είναι 0. Οπότε δεν βρέθηκε κάποιο αποτέλεσμα. Άρα ψάχνουμε στην δεύτερη μας πηγή, το dblp
                else {

                  console.log("DBLPPP")

                  //Στέλνουμε ενα request στην Dblp
                  const dblpRefResult = await axios.get(`https://dblp.org/search/publ/api?q=${query}&h=10&format=json`);

                  //αν υπάρχει αποτέλεσμα από την Dblp
                  if (dblpRefResult.data.result.hits.hit) {
                    //Διατρέχουμε τα αποτελέσματα της πηγής και παίρνουμε τον τίτλο την χρονιά και τον λινκ 
                    const externalRefPromises = dblpRefResult.data.result.hits.hit.map(publicationFoundInDblp => {

                      const externalRef = {
                        title: publicationFoundInDblp.info.title,
                        year: publicationFoundInDblp.info.year,
                        link: publicationFoundInDblp.info.url
                      }
                      //επιστρέφουμε την δημοσίευση
                      return externalRef;


                    })

                    //αποθήκευση αποτελεσμάτων στο publicationsFromDblpSearch για να περιμένουμε να τελειώσουν όλα τα promises
                    const publicationsFromDblpSearch = await Promise.all(externalRefPromises);

                    console.log(publicationsFromDblpSearch.length)

                    //Αν το μέγεθο είναι 1 σημαίνει ότι βρέθηκε δημοσίευση με τον ακριβή τίτλο οπότε δημιουργούμε μια εξωτερική δημοσίευση και στην συσχετίζουμε με την δημοσίευση που δημιουργείται τώρα
                    if (publicationsFromDblpSearch.length === 1) {
                      console.log("if")
                      const externalPublicationCreated = await ExternalPublication.create(publicationsFromDblpSearch[0]);
                      await createdPublication.addExreference(externalPublicationCreated);
                      resolve();
                    }

                    //Αν είναι μεγαλύτερο του 1 τότε απλώς επιστρέφουμε τα αποτελέσματα
                    else if (publicationsFromDblpSearch.length > 1) {
                      console.log("ELSE if")
                      resolve(publicationsFromDblpSearch);
                    }

                    //Διαφορετικά σημαίνει ότι δεν βρέθηκε, οπότε στέλνουμε το αντίστοιχο μήνυμα
                    else {
                      console.log("ELSE")
                      messageSend = 'Did not foun publication with this title';
                      resolve();
                    }
                  }
                }
              });
            });
          };

          //Καλούμε την getPublications για να πάρουμε τις δημοσιεύσεις από τις πηγές και αποθηκεύουμε το αποτέλεσμα στην μεταβλητή Publications
          const publications = await getPublications(params);

          if (publications) {
            //Προσθέτουμε τις μεταβλητέ του publication στον πίνακα externalRefs που θα στείλουμε στον client
            for (let publicationObj of publications) {
              externalRefs.push(publicationObj)
            }
            queySearches.push(removedDuplicatedRefs[i])
          }
        }
      }
    }


    if (externalRefs.length > 1) {


      //Παίρνουμε τις εσωτερικές και εξωτερικές αναφορές
      const internalRef = await createdPublication.getReferences();
      const externalRef = await createdPublication.getExreferences();

      //Αν βρεθούν τότε παίρνουμε τα στατιστικά της τρέχουσας δημοσίευσης και αλλάζουμε το references αντίστοιχα
      if (internalRef) {
        const publicationStat = await createdPublication.getPublicationStat();
        await publicationStat.increment('references', { by: internalRef.length });
      }
      if (externalRef) {
        const publicationStat = await createdPublication.getPublicationStat();
        await publicationStat.increment('references', { by: externalRef.length });
      }



      res.status(200).json({
        message: "Publication Saved! Found Multiple References!",
        messageText: "Publication Saved!",
        publication_id: createdPublication.publication_id,
        references: externalRefs,
        queySearches: queySearches,
        publication: createdPublication
      })
    }

    else {


      //Παίρνουμε τις εσωτερικές και εξωτερικές αναφορές
      const internalRef = await createdPublication.getReferences();
      const externalRef = await createdPublication.getExreferences();

      //Αν βρεθούν τότε παίρνουμε τα στατιστικά της τρέχουσας δημοσίευσης και αλλάζουμε το references αντίστοιχα
      if (internalRef) {
        const publicationStat = await createdPublication.getPublicationStat();
        await publicationStat.increment('references', { by: internalRef.length });
      }
      if (externalRef) {
        const publicationStat = await createdPublication.getPublicationStat();
        await publicationStat.increment('references', { by: externalRef.length });
      }

      return res.status(200).json({
        message: "Publication saved successfully!",
        messageSend: messageSend,
        sectionId: sectionId,
        publication: createdPublication,
        publication_id: createdPublication.publication_id
      })
    }






  }

  else {
    res.status(200).json({
      message: "Publication saved successfully!",
      messageSend: messageSend,
      sectionId: sectionId,
      publicationType: publicationType,
      publication: publicationWithTypeIncluded,
      publication_id: createdPublication.publication_id
    })
  }

}


exports.add_multiple_external_publications = async (req, res, next) => {

  const exPublications = req.body;


  try {
    for (let i in exPublications) {


      console.log(exPublications[i])
      await ExternalPublication.findOrCreate({ where: { title: exPublications[i].title }, defaults: exPublications[i] })

    }

    res.status(201).json({
      message: 'Publications added successfully'
    })

  } catch (er) {

    res.status(401).json({
      message: 'Error', er
    })

  }





}

async function add_multiple_publication_from_api(publications) {

  for (let i in publications) {


    console.log(publications[i])
    if (publications[i].title) {
      await ExternalPublication.findOrCreate({ where: { title: publications[i].title }, defaults: publications[i] }).catch(err => {
        console.log(err)
      })

    }

  }


}


async function get_full_fields_object_from_crossRef(title) {

  axios.get(`https://api.crossref.org/works?query.bibliographic=${title}`)
    .then(response => {
      // Process the response data
      console.log(publicationFound.items[0]);

      let type1 = response.data.message.items[0].type;
      let type2 = type1.charAt(0).toUpperCase() + type1.slice(1);



      switch (type2) {

        case 'Journal-article':
          const publication = {
            title: response.data.message.items[0].title[0],
            abstract: response.data.message.items[0].abstract,
            doi: response.data.message.items[0].DOI,
            isbn: response.data.message.items[0].ISBN[0],
            section: type2,
            year: response.data.message.items[0].issued['date-parts'][0][0]
          }

      }
      const publicationsFound = {
        title: response.data.message.items[0].title[0],
        abstract: response.data.message.items[0].abstract,
        link: response.data.message.items[0].resource.primary.URL,
        doi: response.data.message.items[0].DOI,
        isbn: response.data.message.items[0].ISBN[0],
        section: type2,
        editor: response.data.message.items[0].publisher,
        year: response.data.message.items[0].issued['date-parts'][0][0]
      }
      console.log(publicationsFound)





    })
    .catch(error => {
      console.log(error);
    });

}


exports.get_live_external_publications = async (req, res, next) => {


  try {
    // 3. SERP API
    const query = req.body.query;

    const params = {
      engine: "google_scholar",
      q: query
    };

    let refs = [];
    const callback = async function (data) {

      if (data)

        data["organic_results"].map(publication => {

          const yearPattern = /\d{4}/;
          const yearMatch = publication.publication_info.summary.match(yearPattern);
          const year = yearMatch ? yearMatch[0] : null;
          console.log(publication.title)
          const publicationToAdd = {
            title: publication.title,
            link: publication.link,
            year: year
          }

          if (publicationToAdd && publicationToAdd.title) {
            refs.push(publicationToAdd);
          }



          console.log(publicationToAdd)
        })


      for (let ref of refs) {

        if (ref.title.includes("…")) {
          ref.title = await findFullTitle(ref.title, ref.link)
        }
      }
      add_multiple_publication_from_api(refs)
      res.status(201).json({
        ref: refs
      })

    };

    // Show result as JSON
    search.json(params, callback);

  } catch (err) {
    console.log(err);
  }






}


exports.get_live_internal_publications = async (req, res, next) => {

  const query = req.body.query;

  let searches = await Publication.findAll({
    where: {
      title: {
        [Op.like]: `${query.toLowerCase()}%`
      }
    },
    attributes: ['publication_id', 'title', 'section', 'abstract', 'isbn', 'doi', 'year', 'accessibility']
  });

  searches = searches.slice(0, 10);

  res.status(200).json({
    ref: searches
  })


}


exports.get_all_publications = async (req, res, next) => {





  Publication.findAll({
    include: [{ model: Tag },
    { model: PublicationStats },
    { model: Other }, 'references', 'exreferences',
    { model: Article },
    { model: Book },
    { model: Proceeding },
    { model: Thesis },
    { model: ChapterBk },
    { model: TechReport },
    { model: PublicationPlace, as: 'place' },
    { model: User, as: 'internalAuthors' },
    { model: ExternalAuthor, as: 'externalAuthors' }

    ]
  }).then(async publicationsFound => {



    res.status(200).json({
      message: "message",
      publications: publicationsFound,

    })

  }).catch(err => {

    res.status(500).json({
      message: "Error while fectching the publications",
      error: err.message
    })

  })


}


exports.get_all_my_publications = async (req, res, next) => {





  Publication.findAll({
    include: [{ model: Tag }, 'references', 'exreferences',

    { model: Article },
    { model: Book },
    { model: Proceeding },
    { model: Thesis },
    { model: ChapterBk },
    { model: TechReport },
    { model: Other },
    { model: PublicationStats },
    { model: User, as: 'internalAuthors' },
    { model: ExternalAuthor, as: 'externalAuthors' }
    ], where: { userId: req.userData.userId }
  }).then(publicationsFound => {


    res.status(200).json({
      message: "message",
      publications: publicationsFound,

    })

  }).catch(err => {

    res.status(500).json({
      message: "Error while fectching the publications",
      error: err.message
    })

  })

}


exports.get_single_publication = async (req, res, next) => {



  const publicationFound = await Publication.findByPk(req.params.publicationId);

  if (publicationFound) {
    const refs = await publicationFound.getReferences();

    console.log(refs)
  }



  Publication.findByPk(req.params.publicationId,
    {
      include: [
        { model: Tag },
        'user',
        'references',
        'exreferences',
        'article',
        'book',
        'proceeding',
        'thesis',
        'chapterBk',
        { model: ContentFile, as: 'contentFile' },
        { model: PresentantionFile, as: 'presentantionFile' },
        { model: TechReport },
        { model: Other },
        { model: PublicationStats },
        { model: User, as: 'internalAuthors' },
        { model: ExternalAuthor, as: 'externalAuthors' },
        { model: PublicationPlace, as: 'place' },


      ]
    }).then(async publicationFound => {




      res.status(200).json({
        message: "",
        publication: publicationFound
      })

    }).catch(err => {

      res.status(500).json({
        message: "Error while fectching the publications",
        error: err.message
      })

    })



}


exports.update_single_publication = async (req, res, next) => {



  //δήλωση πίνακα που θα εισάγουμε εξωτερικές δημοσιεύσεις σε περιπτώσεις όπου τα αποτελέσματα αναζήτησης είναι μεγαλύτερα του 1
  let externalRefs = [];

  let message = '';


  // Βρίσκουμε τη δημοσίευση που κάνουμε την ανανέωση
  const publication = await Publication.findByPk(req.params.publicationId);



  if (!publication) {
    res.status(500).json({
      message: "Failed to find publication with this id!"
    })
  }

  else {


    //Ελέγχουμε αν το id του creator της δημοσίευσης είναι ίδιο με αυτό του χρήστη που επιχειρεί να αλλάξει τα στοιχεία της δημοσίευσης
    if (publication.userId === req.userData.userId) {
      console.log("SAME")


      const currentUser = User.findOne({ where: { user_id: req.userData.userId } });
      //await publication.setUser(currentUser);

      //αρχικά ελέγχουμε αν υπάρχουν tag για αλλαγή
      if (req.body.tags) {

        //τοποθετούμε τα tags που στέλνει ο client σε ένα copy πίνακα
        const newTags = [...req.body.tags];
        //Αποθηκεύουμε τις τιμές των string στον παρακάτω πίνακα
        let tagKeywords = newTags.map(tag => {
          return tag.keyword
        })


        /*
        Διατρέχουμε τον πίνακα των newTags που δημιουργήθηκε πιο πάνω
        αρχικά ψάχνουμε αν το ταγκ δεν υπάρχει στο σύστημα οπότε και
        δημιουργούμε ένα αντικείμενο ταγκ
        */
        for (let i = 0; i < tagKeywords.length; i++) {

          Tag.findAll({
            where: {
              keyword: tagKeywords[i]
            }
          }).then(async tag => {


            //αν το αποτέλεσμα είναι μικρότερο του 1 τότε σημαίνει ότι δεν βρέθηκε στην βάση
            if (tag.length < 1) {

              //δημιουργία νέου ταγκ
              await Tag.create({ keyword: tagKeywords[i] }).then(tagCreated => {

                //προσθήκη του ταγκ στην δημοσίευση
                publication.addTag(tagCreated)
              })
            }

          })

        }


        //'Επειτα βρίσκουμε όλα τα tags που μας στέλνει ο χρήστης
        Tag.findAll({ where: { keyword: tagKeywords } }).then(tags => {
          //μετά κάνουμε αλλαγή των ταγκς για την παραπάνω δημοσίευση που βρήκαμε
          publication.setTags(tags)

        })

      }

      console.log("AUTHORS", req.body.authors);

      //Ελέγχουμε αν υπάρχουν συγγραφείς μέσα στο req body
      if (req.body.authors.length > 0) {


        let internalUsersFound = [];
        let externalUsersFound = [];
        for (let author of req.body.authors) {

          //Για εσωτερικούς
          if (author.type === 'Internal') {
            const internalUserFound = await User.findByPk(Number(author.id));
            console.log("Internal ", internalUserFound)
            internalUsersFound.push(internalUserFound)
          }

          //Για εξωτερικούς
          else if (author.type === 'External') {
            const externalUserFound = await ExternalAuthor.findByPk(Number(author.id));
            console.log("External ", externalUserFound);
            externalUsersFound.push(externalUserFound)


          }

        }

        console.log("INTERNAL AUTHORS", internalUsersFound)
        await publication.setInternalAuthors(internalUsersFound);
        await publication.setExternalAuthors(externalUsersFound);


        console.log("ex AUTHORS", externalUsersFound)


        /*
        if (internalUserFound) {
          await publication.setInternalAuthors(internalUserFound);
          await publication.save();

        }
        else {
          console.log("NO INTERNAL")
          await publication.removeInternalAuthors(internalUserFound);
          await publication.save();
        }

        if (externalUserFound) {
          await publication.setExternalAuthors(externalUserFound);
          await publication.save();

        }
        else {
          await publication.removeExternalAuthors(internalUserFound);
          await publication.save();
        }*/

      }
      //Αν δεν υπάρχουν σημαίνει ότι απλώς αφαίρούμε αυτά που υπάρουνχ
      else {
        await publication.setInternalAuthors(null);
        await publication.setExternalAuthors(null);
      }

      ///Έλεγχος αν υπάρχει publication place μαζί με το req body
      if (req.body.publicationPlace) {
        //Εύρεση αντικειμένου Τόπου και συσχέτιση αυτού με την δημοσίευση
        const publicationPlaceFound = await PublicationPlace.findByPk(req.body.publicationPlace.publication_place_id);
        if (publicationPlaceFound) {
          console.log("Publication place---", publicationPlaceFound);
          await publication.setPlace(null)
          await publication.setPlace(publicationPlaceFound)
        }


      }


      let messageSend;
      // σε περίπτωση που το μέγεθος των αναφορών που στέλνει ο χρήστης για ανανέωση είναι 0, τότε απλά αφαιρούμε όλες τις αναφορές
      if (req.body.references.length === 0) {




        //Αν βρεθούν τότε παίρνουμε τα στατιστικά της τρέχουσας δημοσίευσης και αλλάζουμε το references αντίστοιχα


        const publicationStat = await publication.getPublicationStat();
        console.log("STAT", publicationStat)
        publicationStat.references = 0;
        await publicationStat.save();

        const refs = await publication.getReferences();
        for (let ref of refs) {
          const publicationStatsReferences = await ref.getPublicationStat();
          publicationStatsReferences.citations -= 1;
          await publicationStatsReferences.save();
        }

        publication.setReferences(null)
        publication.setExreferences(null)


      }


      let internalMultipleRefs = [];
      let externalMultipleRefs = [];
      let scholarResults = [];

      if (req.body.references && req.body.references.length >= 1) {

        console.log("REFS 45", req.body.references)
        console.log("REFFFFFS", req.body.references)

        //Παίρνουμε τις αναφορές της δημοσίευσης
        const refs = await publication.getReferences();

        //Διατρέχουμε όλες τις αναφορές και αφαιρούμε το citation τους κατα 1
        for (let ref of refs) {
          const publicationStatsReferences = await ref.getPublicationStat();
          publicationStatsReferences.citations -= 1;
          await publicationStatsReferences.save();
        }

        //Παίρνουμε τα στατιστικά της τρέχουσας δημοσίευσης και εισάγουμε τις αναφορές ίση με 0
        const publicationStat = await publication.getPublicationStat();
        publicationStat.references = 0;
        await publicationStat.save();

        publication.setReferences(null)
        publication.setExreferences(null)
        await publication.save();


        //τοποθετούμε τα references που στέλνει ο client σε ένα copy πίνακα
        const references = [...req.body.references];

        //έπειτα καλούμε την μέθοδο για αφαίρεση των διπλών εισαγωγών σε περίπτωση που ο χρήστης εισήγαγε καταλάθος πολλές φορές την ίδια αναφορά
        // Είναι πιθανό να γίνεται έλεγχος εξ αρχής στο frontend για να αποφεχθούν τα διπλότυπα
        const removedDuplicatedRefs = removeDuplicatesAndTrim(references);


        //Αφού αφαιρέσουμε όλα τα διπλότυπα διατρέχουμε όλα τα στοιχεία του πίνακα

        for (let reference of removedDuplicatedRefs) {



          //Αρχικά θα ψάξουμε εσωτερικά στο σύστημα για να βρούμε αν γίνει εσωτερική συσχέτιση μεταξύ των δημοσιεύσεων
          const internalPublicationRefResult = await Publication.findAll({ where: { title: { [Sequelize.Op.eq]: Sequelize.fn("TRIM", reference) } }, ignoreWhitespace: true })

          console.log("Internal Results", internalPublicationRefResult)

          //Αν το αποτέλεσμα της εσωτερικής αναζήτησης είναι ίση με 1 τότε σημαίνει ότι βρέθηκε η Δημοσίευση ως Publication οπότε κάνουμε internalRef συσχέτιση
          if (internalPublicationRefResult.length === 1) {


            //Προσθέτουμε την δημοσίευση ως εσωτερική αναφορά στην δημοσίευση που γίνεται edit
            await publication.addReference(internalPublicationRefResult);


            //Παίρνουμε όλες τις ήδη εσωτερικές αναφορές
            const refs = await publication.getReferences();

            //Αρχικά μειώνουμε το citation όλων των αναφορών της δημοσίευσης και θα γίνει η αύξηση παρακάτω μόνο σε αυτές που πρέπει
            for (let r of refs) {
              const publicationRefStat = await r.getPublicationStat();
              if (publicationRefStat.citations !== 0) {
                publicationRefStat.citations -= 1;
              }
            }





            //Τοποθέτηση όλων των αναφορών σε έναν πίνακα
            const updatedRefsSet = [...refs, ...internalPublicationRefResult];

            //Μεταφορά του παραπάνω updatedRefsSet σε έναν πίνακα που αφαιρούμε τις δημοσιεύσεις με ίδιο ιδ
            const updatedRefs = Array.from(new Map(updatedRefsSet.map(obj => [obj.publication_id, obj])).values());

            //Σετάρισμο των αναφορών για να γίνει η πλήρης ανανέωση
            await publication.setReferences(updatedRefs);

            console.log("UPDATED REFS", updatedRefs)

            //Ενημέρωση citation για όλες τις αναφορές
            for (let ref of updatedRefs) {
              const publicationRefStat = await ref.getPublicationStat();
              console.log("CITATION", publicationRefStat.citations)
              publicationRefStat.citations += 1;
              await publicationRefStat.save();

            }




          }

          //Αν το αποτέλεσμα της εσωτερικής αναζήτησης είναι μεγαλύτερη από 1 τότε απλώς επιστρέφει τα αποτελέσματα αφού πρωτα τα αποθηκεύσουμε σε μια μεταβλητή
          else if (internalPublicationRefResult.length >= 1) {
            internalMultipleRefs = [...internalPublicationRefResult];
          }

          //Σε οποιαδήποτε άλλη περίπτωση σημαίνει ότι δεν βρέθηκε στον πίνακα Publication οπότε θα ψάξουμε στον ExternalPublication
          // που στν ουσία είναι μοντέλο που αποθηκεύονται οι Εξωτερικές Δημοσιεύσεις που έχουν εισαχθεί από τους χρήστες
          else {

            const externalPublicationRefResult = await ExternalPublication.findAll({ where: { title: reference }, ignoreWhitespace: true });

            console.log("External Result", externalPublicationRefResult);


            //Αν το μέγεθος του externalPublicationRefResult είναι ίσο με 1 σημαίνει ότι βρέθηκε στον πίνακα External Publication
            if (externalPublicationRefResult.length === 1) {

              console.log("SIZEE")
              //Προσθέτουμε την δημοσίευση ως εξωτερική αναφορά στην δημοσίευση που γίνεται edit
              await publication.addExreference(externalPublicationRefResult);

              //Παίρνουμε όλες τις ήδη αναφορές
              const ExRefs = await publication.getExreferences();


              //Τοποθέτηση όλων των αναφορών σε έναν πίνακα
              const updatedExRefsSet = [...ExRefs, ...externalPublicationRefResult];

              //Μεταφορά του παραπάνω updatedRefsSet σε έναν πίνακα που αφαιρούμε τις δημοσιεύσεις με ίδιο ιδ
              const updatedExRefs = Array.from(new Map(updatedExRefsSet.map(obj => [obj.externalPublication_id, obj])).values());

              console.log(updatedExRefs)

              //Σετάρισμο των αναφορών για να γίνει η πλήρης ανανέωση
              await publication.setExreferences(updatedExRefs);
              await publication.save();


            }

            //Αν το αποτέλεσμα της αναζήτησης είναι μεγαλύτερη από 1 τότε απλώς επιστρέφει τα αποτελέσματα αφού πρωτα τα αποθηκεύσουμε σε μια μεταβλητή
            else if (externalPublicationRefResult.length >= 1) {
              externalMultipleRefs = [...externalPublicationRefResult];
            }
            /* Αν δεν βρεθεί ο τίτλος ούτε στον πίνακα ExternalReference τότε σημαίνει ότι δεν υπάρχει εσωτερικά
            οπότε θα ψάξουμε απο πηγές στο ιντερνετ. (Google Scholar και DBPL)
            */
            else {

              const query = reference;


              const params = {
                engine: "google_scholar",
                q: query
              }

              const getPublications = async (params) => {
                return new Promise((resolve, reject) => {
                  search.json(params, async result => {
                    const promises = result.organic_results.map(async publication => {
                      const yearPattern = /\d{4}/;
                      const yearMatch = publication.publication_info.summary.match(yearPattern);
                      const year = yearMatch ? yearMatch[0] : null;

                      const publicationToSend = {
                        title: publication.title.includes("…") ? await findFullTitle(publication.title, publication.link) : publication.title,
                        link: publication.link,
                        year: year
                      }

                      return publicationToSend;
                    });


                    const publicationsFromScholarSearch = await Promise.all(promises);

                    //Αν το μέγεθος του πίνακα είναι ίσο με 1 τότε σημαίνει ότι βρέθηκε Δημοσίευση με τον ακριβώς ίδιο τίτλο. Οπότε απλώς κάνουμε τη συσχέτιση
                    if (publicationsFromScholarSearch.length === 1) {
                      const externalPublicationCreated = await ExternalPublication.create(publicationsFromScholarSearch[0]);
                      await publication.addExreference(externalPublicationCreated);
                      resolve();

                    }

                    //Αν το μέγεθος του πίνακα είναι μεγαλύτερο του 1 τότε σημαίνει ότι θα σταλούν όλες οι δημοσιεύσεις που βρέθηκαν σύμφωνα με το αντίστοιχο query
                    else if (publicationsFromScholarSearch.length > 1) {
                      resolve(publicationsFromScholarSearch);
                    }

                    //Σε διαφορετική περίπτωση σημαίνει ότι το μέγεθος είναι 0. Οπότε δεν βρέθηκε κάποιο αποτέλεσμα. Άρα ψάχνουμε στην δεύτερη μας πηγή, το dblp
                    else {

                      console.log("DBLPPP")

                      //Στέλνουμε ενα request στην Dblp
                      const dblpRefResult = await axios.get(`https://dblp.org/search/publ/api?q=${query}&h=10&format=json`);

                      //αν υπάρχει αποτέλεσμα από την Dblp
                      if (dblpRefResult.data.result.hits.hit) {
                        //Διατρέχουμε τα αποτελέσματα της πηγής και παίρνουμε τον τίτλο την χρονιά και τον λινκ 
                        const externalRefPromises = dblpRefResult.data.result.hits.hit.map(publicationFoundInDblp => {

                          const externalRef = {
                            title: publicationFoundInDblp.info.title,
                            year: publicationFoundInDblp.info.year,
                            link: publicationFoundInDblp.info.url
                          }
                          //επιστρέφουμε την δημοσίευση
                          return externalRef;


                        })

                        //αποθήκευση αποτελεσμάτων στο publicationsFromDblpSearch για να περιμένουμε να τελειώσουν όλα τα promises
                        const publicationsFromDblpSearch = await Promise.all(externalRefPromises);

                        console.log(publicationsFromDblpSearch.length)

                        //Αν το μέγεθο είναι 1 σημαίνει ότι βρέθηκε δημοσίευση με τον ακριβή τίτλο οπότε δημιουργούμε μια εξωτερική δημοσίευση και στην συσχετίζουμε με την δημοσίευση που δημιουργείται τώρα
                        if (publicationsFromDblpSearch.length === 1) {
                          console.log("if")
                          const externalPublicationCreated = await ExternalPublication.create(publicationsFromDblpSearch[0]);
                          await publication.addExreference(externalPublicationCreated);
                          resolve();
                        }

                        //Αν είναι μεγαλύτερο του 1 τότε απλώς επιστρέφουμε τα αποτελέσματα
                        else if (publicationsFromDblpSearch.length > 1) {
                          console.log("ELSE if")
                          resolve(publicationsFromDblpSearch);
                        }

                        //Διαφορετικά σημαίνει ότι δεν βρέθηκε, οπότε στέλνουμε το αντίστοιχο μήνυμα
                        else {
                          console.log("ELSE")
                          messageSend = 'Did not foun publication with this title';
                          resolve();
                        }
                      }
                    }
                  });
                });
              };

              //Καλούμε την getPublications για να πάρουμε τις δημοσιεύσεις από τις πηγές και αποθηκεύουμε το αποτέλεσμα στην μεταβλητή Publications
              const publications = await getPublications(params);


              if (publications) {
                scholarResults = [...publications];
                console.log("SCHOLAR", publications)
              }

            }


          }


        }


        //Σετάρισμα των στατιστικών
        // Αρχικά παίρνουμε το obj στατιστικά της δημοσίευσης, έπειτα παίρνουμε τις εσωτερικές και εξωτερικές αναφορές της.
        // Εν συνεχεία εισάγουμε την τιμή με βάση τα μεγέθη των πινάκων και τέλος κάνουμε save.
        const publicationStatToSet = await publication.getPublicationStat();
        const insideRefs = await publication.getReferences();
        const extRefs = await publication.getExreferences();
        publicationStatToSet.references = insideRefs.length + extRefs.length
        await publicationStatToSet.save();




      }

      let sectionId;
      if (req.body.section !== publication.section) {
        console.log(1)
        console.log(req.body)

        console.log("NEW ", req.body.section)
        console.log("Old ", publication.section)



        //Περίπτωσεις για την διαγραφή των εκάστωτε αντικειμένων
        switch (publication.section) {

          case 'Article':
            console.log(publication.publication_id)
            console.log()
            const article = await Article.findOne({ where: { publicationId: publication.publication_id } });

            if (!article) {
              return res.status(404).json({ message: 'Article not found' });
            }

            await article.destroy();
            console.log(article);
            break;

          case 'Proceedings':
            const proceeding = await Proceeding.findOne({ where: { publicationId: publication.publication_id } });
            if (!proceeding) {
              return res.status(404).json({ message: 'Proceeding not found' });
            }
            await proceeding.destroy();
            break;

          case 'Book':
            const book = await Book.findOne({ where: { publicationId: publication.publication_id } });
            if (!book) {
              return res.status(404).json({ message: 'Book not found' });
            }
            await book.destroy();
            break;

          case 'Book_Chapter':
            const bookChapter = await ChapterBk.findOne({ where: { publicationId: publication.publication_id } });
            if (!bookChapter) {
              return res.status(404).json({ message: 'Book Chapter not found' });
            }
            await bookChapter.destroy();
            break;

          case 'Tech_Report':
            const techReport = await TechReport.findOne({ where: { publicationId: publication.publication_id } });
            if (!techReport) {
              return res.status(404).json({ message: 'Tech Report not found' });
            }
            await techReport.destroy();
            break;

          case 'Thesis':
            const thesis = await Thesis.findOne({ where: { publicationId: publication.publication_id } });
            if (!thesis) {
              return res.status(404).json({ message: 'Article not found' });
            }
            await thesis.destroy();
            break;

          case 'Other':
            const other = await Other.findOne({ where: { publicationId: publication.publication_id } });
            if (!other) {
              return res.status(404).json({ message: 'Other not found' });
            }
            await other.destroy();
            break;

        }


        //Περίπτωσεις για την δημιουργία των νέων  αντικειμένων
        switch (req.body.section) {



          case 'Article':

            const article = {
              jurnal: req.body.jurnal,
              number: req.body.number,
              volume: req.body.volume,
              pages: req.body.pages,
              month: req.body.month
            }

            console.log(1, " ", article)

            //Δημιουργία νέου αντικειμένου τύπου Article
            const articleCreated = await Article.create(article);
            //Συσχέτιση Article με το publication
            publication.setArticle(articleCreated);
            //Αποθήκευση id στο section id που στέλνουμε μετά στον client
            sectionId = articleCreated.article_id;
            console.log(sectionId);

            break;

          case 'Proceedings':
            const proceeding = {
              editor: req.body.editor,
              series: req.body.series,
              pages: req.body.pages,
              month: req.body.month,
              organization: req.body.organization,
              address: req.body.address,
              publisher: req.body.publisher,

            }

            //Δημιουργία νέου αντικειμένου τύπου Proceeding
            const proCreated = await Proceeding.create(proceeding);
            //Συσχέτιση Proceeding με το publication
            publication.setProceeding(proCreated);
            //Αποθήκευση id στο section id που στέλνουμε μετά στον client
            sectionId = proCreated.proceeding_id;
            console.log(sectionId);
            break;

          case 'Book':
            const book = {
              publisher: req.body.publisher,
              volume: req.body.volume,
              series: req.body.series,
              pages: req.body.pages,
              month: req.body.month,
              address: req.body.address,
              version: req.body.version,

            }


            //Δημιουργία νέου αντικειμένου τύπου Book
            const bookCreated = await Book.create(book);
            //Συσχέτιση Proceeding με το publication
            publication.setBook(bookCreated);
            //Αποθήκευση id στο section id που στέλνουμε μετά στον client
            sectionId = bookCreated.book_id;
            break;

          case 'Book_Chapter':
            console.log(req.body);

            const book_chapter = {

              chapter: req.body.chapter,
              publisher: req.body.publisher,
              pages: req.body.pages,
              volume: req.body.volume,
              series: req.body.series,
              type: req.body.type,
              month: req.body.month,
              address: req.body.address,
              version: req.body.version,

            }


            //Δημιουργία νέου αντικειμένου τύπου Book
            const book_chapterCreated = await ChapterBk.create(book_chapter);
            //Συσχέτιση Proceeding με το publication
            publication.setChapterBk(book_chapterCreated);
            //Αποθήκευση id στο section id που στέλνουμε μετά στον client
            sectionId = book_chapterCreated.book_chapter_id;
            console.log(sectionId);
            break;

          case 'Tech_Report':
            const techReport = {
              address: req.body.address,
              month: req.body.month,
              number: req.body.number,
              type: req.body.type,
              tech_report_year: req.body.tech_report_year,
              institution: req.body.institution

            }

            //Δημιουργία νέου αντικειμένου τύπου Book
            const techReportCreated = await TechReport.create(techReport);
            //Συσχέτιση Proceeding με το publication
            publication.setTechReport(techReportCreated);
            //Αποθήκευση id στο section id που στέλνουμε μετά στον client
            sectionId = techReportCreated.tech_report_id;
            console.log(sectionId);
            break;



          case 'Thesis':
            const thesis = {
              school: req.body.school,
              type: req.body.type,
              month: req.body.month,
              address: req.body.address
            }

            //Δημιουργία νέου αντικειμένου τύπου Book
            const thesisCreated = await Thesis.create(thesis);
            //Συσχέτιση Proceeding με το publication
            publication.setThesis(thesisCreated);
            //Αποθήκευση id στο section id που στέλνουμε μετά στον client
            sectionId = thesisCreated.thesis_id;
            console.log(sectionId);
            break;



          case 'Other':

            const other = {
              subType: req.body.subType,
              grantNumber: req.body.grantNumber,
              pages: req.body.pages,
              month: req.body.month
            }

            console.log(1, " ", other)

            //Δημιουργία νέου αντικειμένου τύπου Article
            const otherCreated = await Other.create(other);
            //Συσχέτιση Article με το publication
            publication.setOther(otherCreated);
            //Αποθήκευση id στο section id που στέλνουμε μετά στον client
            sectionId = otherCreated.other_id;
            console.log(sectionId);

            break;

        }



      }

      //αν το section είναι ίδιο τότε απλώς αλλάζουμε τα fields απο το αντίστοιχο object στη βάση
      else {

        console.log("SAMEEEE", req.body)

        switch (req.body.section) {

          case 'Article': {
            const newArticle = {
              jurnal: req.body.jurnal,
              number: req.body.number,
              volume: req.body.volume,
              pages: req.body.pages,
              month: req.body.month
            }
            console.log("newArticle", req.body)
            await Article.update(newArticle, { where: { publicationId: req.params.publicationId } });

            //Βρίσκουμε την Δημοσίευση που μόλις δημιουργήθηκε μετά την αλλαγή και αποθηκεύουμε το article id στο sectionId
            await Article.findOne({ where: { publicationId: req.params.publicationId } }).then(articleFound => {

              sectionId = articleFound.article_id

            })

            console.log(sectionId)


          }
            break;



          case 'Book': {
            const newBook = {
              publisher: req.body.publisher,
              volume: req.body.volume,
              series: req.body.series,
              pages: req.body.pages,
              month: req.body.month,
              address: req.body.address,
              version: req.body.version
            }

            await Book.update(newBook, { where: { publicationId: req.params.publicationId } });

            //Βρίσκουμε την Δημοσίευση που μόλις δημιουργήθηκε μετά την αλλαγή και αποθηκεύουμε το Book id στο sectionId
            await Book.findOne({ where: { publicationId: req.params.publicationId } }).then(bookFound => {

              sectionId = bookFound.book_id

            });
          }
            break;

          case 'Proceedings': {
            const newProceedings = {
              editor: req.body.editor,
              series: req.body.series,
              pages: req.body.pages,
              month: req.body.month,
              organization: req.body.organization,
              address: req.body.address,
              publisher: req.body.publisher
            }

            await Proceeding.update(newProceedings, { where: { publicationId: req.params.publicationId } });

            //Βρίσκουμε την Δημοσίευση που μόλις δημιουργήθηκε μετά την αλλαγή και αποθηκεύουμε το Proceeding id στο sectionId
            await Proceeding.findOne({ where: { publicationId: req.params.publicationId } }).then(proceedingsFound => {

              sectionId = proceedingsFound.proceeding_id

            });
          }
            break;

          case 'Thesis':
            {
              const newThesis = {
                school: req.body.school,
                type: req.body.type,
                month: req.body.month,
                address: req.body.address
              }

              await Thesis.update(newThesis, { where: { publicationId: req.params.publicationId } });

              //Βρίσκουμε την Δημοσίευση που μόλις δημιουργήθηκε μετά την αλλαγή και αποθηκεύουμε το Thesis id στο sectionId
              await Thesis.findOne({ where: { publicationId: req.params.publicationId } }).then(thesisFound => {

                sectionId = thesisFound.thesis_id

              });
            }
            break;

          case 'Book_Chapter': {
            const newBookChapter = {
              chapter: req.body.chapter,
              publisher: req.body.publisher,
              pages: req.body.pages,
              volume: req.body.volume,
              series: req.body.series,
              type: req.body.type,
              month: req.body.month,
              address: req.body.address,
              version: req.body.version,
            }

            await ChapterBk.update(newBookChapter, { where: { publicationId: req.params.publicationId } });

            //Βρίσκουμε την Δημοσίευση που μόλις δημιουργήθηκε μετά την αλλαγή και αποθηκεύουμε το ChapterBk id στο sectionId
            await ChapterBk.findOne({ where: { publicationId: req.params.publicationId } }).then(bookCpFound => {

              sectionId = bookCpFound.book_chapter_id

            });
          }
            break;

          case 'Tech_Report': {
            const newTechReport = {
              address: req.body.address,
              month: req.body.month,
              number: req.body.number,
              type: req.body.type,
              tech_report_year: req.body.tech_report_year,
              institution: req.body.institution
            }

            await TechReport.update(newTechReport, { where: { publicationId: req.params.publicationId } });

            //Βρίσκουμε την Δημοσίευση που μόλις δημιουργήθηκε μετά την αλλαγή και αποθηκεύουμε το TechReport id στο sectionId
            await TechReport.findOne({ where: { publicationId: req.params.publicationId } }).then(techReportFound => {

              sectionId = techReportFound.tech_report_id

            });
          }
            break;


          case 'Other': {
            const newOther = {
              subType: req.body.subType,
              grantNumber: req.body.grantNumber,
              pages: req.body.pages,
              month: req.body.month
            }

            console.log(req.body)

            await Other.update(newOther, { where: { publicationId: req.params.publicationId } });

            //Βρίσκουμε την Δημοσίευση που μόλις δημιουργήθηκε μετά την αλλαγή και αποθηκεύουμε το article id στο sectionId
            await Other.findOne({ where: { publicationId: req.params.publicationId } }).then(otherFound => {

              sectionId = otherFound.other_id

            })


          }
            break;

          default:
            break;



        }


      }


      const response = await Publication.update(req.body, { where: { publication_id: req.params.publicationId } })



      //Τέλος κάνουμε τις αλλαγές για τα στοιχεία της Δημοσίευσης
      Publication.update(
        req.body,
        { where: { publication_id: req.params.publicationId } }

      ).then(publicationUpdated => {

        res.status(200).json({
          message: "Publication updated successfully! " + message,
          publicationUpdated: publicationUpdated,
          publication: req.body,
          references: externalRefs,
          sectionId: sectionId,
          scholarResults: scholarResults
        })

      }).catch(err => {

        console.log(err);

      })



    }
    else {

      res.status(401).json({
        message: "Not authorized"
      })
    }
  }



}


exports.delete_single_publication = async (req, res, next) => {


  const publicationToDelete = await Publication.findOne({ where: { publication_id: req.params.publicationId } });


  //Αρχικά ελέγχουμε αν βρέθηκε η δημοσίευση προς διαγραφή
  if (publicationToDelete) {


    //Σε περίπτωση που διαγραφή αυτό που αναφέρει
    //Παίρνουμε τις αναφορές
    const references = await InternalReference.findAll({ where: { referencePublicationId: publicationToDelete.publication_id } });
    //τοποθετούμε σε έναν πίνακα τα ids των δημοσιεύσεων
    let pubIds = []
    for (let ref of references) {
      pubIds.push(ref.publicationPublicationId)

    }
    //Βρίσκουμε την κάθε δημοσίευση με βάση το id και αλλάζουμε το περιεχόμενο του πίνακα PublicationStat 
    for (let id of pubIds) {
      const publicationFound = await Publication.findByPk(id);
      if (publicationFound) {
        const publicationStat = await publicationFound.getPublicationStat();
        await publicationStat.decrement('references', { by: 1 });
      }
    }






    //Σε περίπτωση που διαγραφή αυτό που αναφέρεται
    const refs2 = await publicationToDelete.getReferences();
    //τοποθετούμε σε έναν πίνακα τα ids των δημοσιεύσεων
    let pubIds2 = []
    for (let ref of refs2) {
      pubIds2.push(ref.publication_id)
    }
    //Βρίσκουμε την κάθε δημοσίευση με βάση το id και αλλάζουμε το περιεχόμενο του πίνακα PublicationStat 
    for (let id of pubIds2) {
      const publicationFound = await Publication.findByPk(id);
      console.log(publicationFound)
      if (publicationFound) {
        const publicationStat = await publicationFound.getPublicationStat();
        await publicationStat.decrement('citations', { by: 1 });
      }
    }




    try {


    } catch (err) {
      console.log(err)
    }


    if (publicationToDelete.userId === req.userData.userId) {
      Publication.destroy({
        where: { publication_id: req.params.publicationId }
      }).then(num => {

        if (num === 1) {

          //παίρνουμε το user id
          const userId = req.userData.userId;
          const targetDirectory = `./uploads/${userId}/${publicationToDelete.publication_id}`;

          console.log(targetDirectory)
          if (fs.existsSync(targetDirectory)) {

            fsExtra.remove(targetDirectory, (err) => {
              if (err) {
                console.error('Error occurred in deleting directory', err);
              } else {
                console.log('Directory deleted successfully');
              }
            });
          }


          res.status(200).json({
            message: "Publication deleted successfully!"
          })
        }
        else {
          res.status(201).json({
            message: "Publication was not found"
          })
        }

      }).catch(err => {

        console.log("ERROR ", err)
        res.status(500).json({
          message: "Failed to delete publication!"
        })

      })



    }
    else {

      res.status(401).json({
        message: 'Not authorized'
      })

    }



  }







}


exports.delete_all_publications = (req, res, next) => {


  Publication.destroy({
    where: {}
  }).then(num => {

    if (num === 1) {
      res.status(200).json({
        message: "Publications deleted successfully!"
      })
    }
    else {
      res.status(201).json({
        message: "No Publications Found"
      })
    }

  }).catch(err => {

    res.status(500).json({
      message: "Failed to delete publication!"
    })

  })


}


exports.search_single_publication_based_on_identifier = async (req, res, next) => {

  let createdPublication;
  let sectionCreated;
  let publicationType;
  let publication;
  let message;


  const identifier = req.body.identifier



  //Σε περίπτωση που ο χρήστης επιλέξει εισαγωγή με βάση το DOI
  if (identifier === 'DOI') {
    // Working for DOI, aRxiv and Title
    let query;

    const url = `https://api.crossref.org/works/${req.body.inputSearch}`



    try {



      const responseFromCrossRefApi = await axios.get(url)

      if (responseFromCrossRefApi.data.message) {

        console.log(responseFromCrossRefApi.data.message)

        let publicationResponse = responseFromCrossRefApi.data.message;

        //Σετάρισμα του ISBN αν υπάρχει
        let isbnToSet;
        if (publicationResponse.ISBN) {
          if (publicationResponse.ISBN.length === 2) {
            isbnToSet = publicationResponse.ISBN[1];
            console.log(publicationResponse.ISBN[1])
          }
          else if (publicationResponse.ISBN.length === 1) {
            isbnToSet = publicationResponse.ISBN[0]
          }

        } else {
          isbnToSet = null
        }


        //Σετάρισμα χρονιάς αν υπάρχει
        let yearToSet;

        if (publicationResponse.published) {
          yearToSet = publicationResponse.published['date-parts'][0][0]
          console.log(publicationResponse.published['date-parts'][0][0])
        }
        else {
          yearToSet = null
        }


        //Σετάρισμα του τύπου της δημοσίευσης
        let sectionToSet;
        console.log(publicationResponse)
        if (publicationResponse.type === 'journal-article') {
          sectionToSet = 'Article'

        }

        else if (publicationResponse.type === 'book-chapter') {
          sectionToSet = 'Book_Chapter'
        }

        else if (publicationResponse.type === 'book' || publicationResponse.type === 'book-series') {
          sectionToSet = 'Book'
        }

        else if (publicationResponse.type === 'proceedings-article' || publicationResponse.type === 'proceedings' || publicationResponse.type === 'proceedings-series') {
          sectionToSet = 'Proceedings'
        }

        else if (publicationResponse.type === 'report' || publicationResponse.type === 'report-component' || publicationResponse.type === 'report-series') {
          sectionToSet = 'Tech_Report'
        }

        else if (publicationResponse.type === 'dissertation') {
          sectionToSet = 'Thesis'
        }

        else {
          sectionToSet = 'Other'
        }


        //Έπειτα θα πρέπει να καθορίσουμε το πεδίο abstract για την δημοσίευση. Συνήθως δεν περιέχεται στην crossRef πηγή.
        // Οπότε αρχικά θα καλέσουμε το serpApi για να βρούμε το πεδίο snippet της αντίστοιχης Δημοσίευσης. Που στην
        // ουσία είναι το abstract αλλά κομμένο.


        publication = {
          title: publicationResponse.title ? publicationResponse.title[0].replace(/<[^>]*>/g, ' ') : "",
          section: sectionToSet,
          abstract: publicationResponse.abstract ? publicationResponse.abstract.replace(/\n/g, '').replace(/<[^>]+>/g, '') : "", //Θα γίνει χρήση του scholar για να βρίσκουμε το snippet μέσω του τίτλου και έπειτα θα γίνεται η αναζήτητ του ολοκληρωμένου abstract απο το findFullAbstract μέθδοο
          isbn: isbnToSet,
          doi: publicationResponse.DOI,
          year: yearToSet
        }


        console.log("publication created---", publication)

        // Save the modified publication object in the database and return it
        createdPublication = await savePublication(publication, req.userData, responseFromCrossRefApi);



        if (createdPublication) {
          res.status(200).json({
            message: "Publication added successfully",
            createdPublication: createdPublication
          })
        }


      }

      else {
        res.status(404).json({
          message: 'Something went wrong.\n Please double-check the identifier you provided to ensure its accuracy'
        })
      }

      console.log()


    } catch (err) {

      console.log("EROR", err)

      res.status(404).json({
        message: 'Something went wrong.\n Please double-check the identifier you provided to ensure its accuracy'
      })

    }

    //console.log("ABSTRACT : ", publication.abstract.length)
    let fullAbstract;
    let link;

  }

  //Σε περίπτωση που ο χρήστης επιλέξει εισαγωγή με βάση το aRxiv
  else if (identifier === 'aRxiv') {



    //Αρχικά εφόσον μιλάμε για αναζήτηση με βάση το aRxiv τότε στέλνουμε ένα request sto arxiv api με βάση το συγκεκριμένο aRxiv που μας στέλνει ο client
    publication = await axios.get(`http://export.arxiv.org/api/query?id_list=${req.body.inputSearch}`).then(async response => {

      let publicationToReturn;

      //αν έχουμε αποτέλεσμα τότε το μετατρέπουμε αρχικά σε json και έπειτα αποθηκεύουμε το στην μεταβλητή publicationToReturn διαφορετικά απλώς κάνουμε return
      if (response.data) {
        const { parseStringPromise } = require('xml2js');
        const jsonResult = await parseStringPromise(response.data);
        if (jsonResult.feed.entry) {
          jsonResult.feed.entry.map(publicationFound => {

            console.log(publicationFound)

            publication = {
              title: publicationFound.title ? publicationFound.title[0].replace(/\n/g, "") : "",
              abstract: publicationFound.summary ? publicationFound.summary[0].replace(/\n/g, "") : ""
            }
            publicationToReturn = publication
          })

        }

        return publicationToReturn

      }

      else {

        return
      }

    }).catch(err => {
      console.log("ERROR")
    });




    //Αν το αποτέλεσμα τις παραπάνω συνάρτησης είναι έγκυρη τότε δημιουργούμε το publication αντικείμενο και το αντίστοιχο section αντικείμενο
    if (publication) {



      //const result = await axios.get(`https://serpapi.com/search?q=${publication.title}&engine=google_scholar&num=10&api_key=${"60ec0fe2a88b7554ba64c60de952913a1019bd4825d0f0973682786921859ee9"}`)
      //console.log(result.data)
      //let fullPublicationObj = await findFullObectBasedOnTitle(publication.title);
      //console.log("FULL OBJECTS", fullPublicationObj)
      // console.log("FULL", fullPublicationObj)

      /*
      //Για να βρούμε το ολικό αντικείμενο στέλνουμε ένα request στο crossref api 
      
      axios.get(url, { params: { query: publication.title } }).then(response => {

        //αν υπάρξει απάντηση διατρέχουμε το αντικείμενο
        if (response.data.message) {

          response.data.message.items.map(async publicationFound => {

            //παίρνουμε μόνο το αντικείμενο που έχει κοινό τίτλο με αυτόν που ψάχνουμε
            if (publicationFound.title[0].toLowerCase().trim().replace(/\s/g, '').includes(publication.title.toLowerCase().trim().replace(/\s/g, ''))) {


              //Σετάρισμα του τύπου της δημοσίευσης
              let sectionToSet;
              if (publicationFound.type === 'journal-article') {
                sectionToSet = 'Article'
              }

              else if (publicationFound.type === 'book-chapter') {
                sectionToSet = 'Book_Chapter'
              }

              else if (publicationFound.type === 'book' || publicationFound.type === 'book-series') {
                sectionToSet = 'Book'
              }

              else if (publicationFound.type === 'proceedings-article' || publicationFound.type === 'proceedings' || publicationFound.type === 'proceedings-series') {
                sectionToSet = 'Proceedings'
              }

              else if (publicationFound.type === 'report' || publicationFound.type === 'report-component' || publicationFound.type === 'report-series') {
                sectionToSet = 'Tech_Report'
              }

              else if (publicationFound.type === 'dissertation') {
                sectionToSet = 'Thesis'
              }

              else {
                sectionToSet = 'Other'
              }

              //Σετάρισμα του ISBN αν υπάρχει
              let isbnToSet;
              if (publicationFound.ISBN) {
                if (publicationFound.ISBN.length === 2) {
                  isbnToSet = publicationFound.ISBN[1];
                  console.log(publicationFound.ISBN[1])
                }
                else if (publicationFound.ISBN.length === 1) {
                  isbnToSet = publicationFound.ISBN[0]
                }

              } else {
                isbnToSet = null
              }


              //Σετάρισμα χρονιάς αν υπάρχει
              let yearToSet;

              if (publicationFound.published) {
                yearToSet = publicationFound.published['date-parts'][0][0]
                console.log(publicationFound.published['date-parts'][0][0])
              }

              else {
                yearToSet = null
              }

              //Δημιουργία αντικειμένου publication 

              let abstractToSet;

              if (publication.abstract) {
                abstractToSet = publication.abstract;
              }

              else if (publicationFound.abstract) {
                abstractToSet = publicationFound.abstract
              }

              else {
                abstractToSet = null
              }

              publicationFullObj = {
                title: publication.title,
                section: sectionToSet,
                abstract: abstractToSet,
                isbn: isbnToSet,
                year: yearToSet,
                doi: publicationFound.DOI ? publicationFound.DOI : null,
              }


              const createdPublication = await Publication.create(publicationFullObj, { include: [Article, Book, Proceeding, Thesis, ChapterBk, TechReport] });

              // Find the user from the database based on the userData object stored in the request
              const userCreator = await User.findOne({ where: { user_id: userData.userId } });

              // Connect the created publication with the current user
              await createdPublication.setUser(userCreator);

              switch (sectionToSet) {


                case 'Article':

                  let jurnalToSet;
                  if (publicationFound['short-container-title'][0]) {
                    jurnalToSet = publicationFound['short-container-title'][0];
                  }
                  else if (publicationFound['container-title'][0]) {
                    jurnalToSet = publicationFound['container-title'][0];
                  }
                  else {
                    jurnalToSet = ""
                  }

                  sectionCreated = {
                    jurnal: jurnalToSet,
                    number: publicationFound.issue ? publicationFound.issue : null,
                    volume: publicationFound.volume ? publicationFound.volume : null,
                    pages: publicationFound.page ? publicationFound.page : null,
                    month: publicationFound.month ? publicationFound.month : 'Not Defined'
                  }

                  console.log(sectionCreated)

                  break;

                case 'Book_Chapter':

                  let chapterToSet;

                  if (publicationFound['container-title']) {
                    chapterToSet = publicationFound['container-title'][0]
                  }
                  else {
                    chapterToSet = ""
                  }

                  sectionCreated = {
                    chapter: chapterToSet,
                    publisher: publicationFound.publisher ? publicationFound.publisher : "",
                    pages: publicationFound.page ? publicationFound.page : "",
                    volume: publicationFound['edition-number'] ? publicationFound['edition-number'] : null,
                    series: publicationFound.series ? publicationFound.series : null,
                    type: 'Book_Chapter'
                  }
                  console.log(sectionCreated)

                  break;

                case 'Book':

                  let publisherToSet;
                  if (publicationFound.publisher) {
                    publisherToSet = publicationFound.publisher
                  }
                  else {
                    publisherToSet = ""
                  }

                  console.log(publicationFound)
                  sectionCreated = {
                    publisher: publisherToSet,
                    number: publicationFound.issue ? publicationFound.issue : null,
                    volume: publicationFound.volume ? publicationFound.volume : null,
                    pages: publicationFound.page ? publicationFound.pages : null,
                    month: publicationFound.month ? publicationFound.month : 'Not Defined',
                    series: publicationFound.series ? publicationFound.series : null,
                    address: publicationFound.address ? publicationFound.address : null,
                    version: publicationFound.version ? publicationFound.version : null,
                  }
                  console.log(sectionCreated)
                  console.log(publicationFound.issued['date-parts']);

                  break;


                case 'Proceedings':


                  let monthToSet = 'Not Defined';
                  if (publicationFound.published) {
                    let monthNumber = publicationFound.published['date-parts'][0][1];

                    switch (monthNumber) {

                      case 1:
                        monthToSet = 'January'
                        break;

                      case 2:
                        monthToSet = 'February';
                        break;
                      case 3:
                        monthToSet = 'March';
                        break;
                      case 4:
                        monthToSet = 'April';
                        break;
                      case 5:
                        monthToSet = 'May';
                        break;
                      case 6:
                        monthToSet = 'June';
                        break;
                      case 7:
                        monthToSet = 'July';
                        break;
                      case 8:
                        monthToSet = 'August';
                        break;
                      case 9:
                        monthToSet = 'September';
                        break;
                      case 10:
                        monthToSet = 'October';
                        break;
                      case 11:
                        monthToSet = 'November';
                        break;
                      case 12:
                        monthToSet = 'December';
                        break;

                    }
                  }


                  let editorToSet;
                  if (publicationFound.publisher) {
                    editorToSet = publicationFound.publisher
                  }
                  else {
                    editorToSet = ""
                  }

                  sectionCreated = {
                    editor: editorToSet,
                    number: publicationFound.issue ? publicationFound.issue : null,
                    volume: publicationFound.volume ? publicationFound.volume : null,
                    pages: publicationFound.page ? publicationFound.pages : null,
                    month: monthToSet,
                    organization: publicationFound.publisher ? publicationFound.publisher : null,
                    address: publicationFound.event.location ? publicationFound.event.location : null,
                    publisher: publicationFound.publisher ? publicationFound.publisher : null,
                  }
                  console.log(sectionCreated)
                  break;


                case 'Tech_Report':

                  let institutionToSet;
                  console.log(publicationFound)
                  if (publicationFound.institution && publicationFound.institution.length > 0) {
                    institutionToSet = publicationFound.institution[0]['name']
                  }
                  else {
                    institutionToSet = ""
                  }

                  let monthToSett = "Not Defined";
                  if (publicationFound.published['date-parts']) {
                    let monthNumber = publicationFound.published['date-parts'][0][1];

                    switch (monthNumber) {

                      case 1:
                        monthToSett = 'January'
                        break;

                      case 2:
                        monthToSett = 'February';
                        break;
                      case 3:
                        monthToSett = 'March';
                        break;
                      case 4:
                        monthToSett = 'April';
                        break;
                      case 5:
                        monthToSett = 'May';
                        break;
                      case 6:
                        monthToSett = 'June';
                        break;
                      case 7:
                        monthToSett = 'July';
                        break;
                      case 8:
                        monthToSett = 'August';
                        break;
                      case 9:
                        monthToSett = 'September';
                        break;
                      case 10:
                        monthToSett = 'October';
                        break;
                      case 11:
                        monthToSett = 'November';
                        break;
                      case 12:
                        monthToSett = 'December';
                        break;

                    }
                  }


                  sectionCreated = {
                    institution: institutionToSet,
                    address: response.data.message['publisher-location'] ? response.data.message['publisher-location'] : null,
                    month: monthToSett,
                    tech_report_year: publication.year,
                    type: response.data.message.type,
                  }


                  console.log(sectionCreated)
                  break;


                case 'Thesis':

                  let schoolToSet;
                  if (publicationFound.institution) {
                    schoolToSet = publicationFound.institution[0]['name']
                  }
                  else {
                    schoolToSet = ""
                  }

                  let degreeToSet = 'Other';
                  if (publicationFound.degree) {
                    if (publicationFound.degree[0].toLowerCase().includes('master')) {
                      degreeToSet = 'Master'
                    }
                    else if (publicationFound.degree[0].toLowerCase().includes('phd')) {
                      degreeToSet = 'PhD'
                    }
                    else {
                      degreeToSet = 'Other';
                    }
                  }


                  console.log(publicationFound.deposited['date-parts']);

                  let monthToSet2 = 'Not Defined';
                  if (publicationFound.deposited) {
                    let monthNumber = publicationFound.deposited['date-parts'][0][1];

                    switch (monthNumber) {

                      case 1:
                        monthToSet2 = 'January'
                        break;

                      case 2:
                        monthToSet2 = 'February';
                        break;
                      case 3:
                        monthToSet2 = 'March';
                        break;
                      case 4:
                        monthToSet2 = 'April';
                        break;
                      case 5:
                        monthToSet2 = 'May';
                        break;
                      case 6:
                        monthToSet2 = 'June';
                        break;
                      case 7:
                        monthToSet2 = 'July';
                        break;
                      case 8:
                        monthToSet2 = 'August';
                        break;
                      case 9:
                        monthToSet2 = 'September';
                        break;
                      case 10:
                        monthToSet2 = 'October';
                        break;
                      case 11:
                        monthToSet2 = 'November';
                        break;
                      case 12:
                        monthToSet2 = 'December';
                        break;

                    }
                  }
                  sectionCreated = {
                    school: schoolToSet,
                    type: degreeToSet,
                    month: monthToSet2,
                    address: publicationFound.publisher ? publicationFound.publisher : null,

                  }

                  break;


                default:

                  sectionCreated = {
                    publisher: response.data.message.publisher ? response.data.message.publisher : null,
                    type: response.data.message.type
                  }
                  console.log(sectionCreated)
                  break;
              }



            }

            else {
              console.log("DEN BRETHIKE STO CROSSREF ME TETOI TITLO", " ", publicationFound.title[0]);
            }




          })

          return;

        }

        else {
          console.log("Den brethike STO CROSSREF")
        }


      }).catch(err => {

        console.log(err)

      })*/

      const url = `https://api.crossref.org/works`

      try {

        let publicationsFound = await axios.get(url, { params: { query: publication.title } });
        let publicationsTitle = [];
        let publicationFound;
        if (publicationsFound.data.message.items) {

          //console.log(publicationsFound.data.message.items.length())
          publicationsFound.data.message.items.map(publicationFoundCrossRef => {
            console.log(publicationFoundCrossRef)
            publicationsTitle.push(publicationFoundCrossRef.title ? publicationFoundCrossRef.title[0].toLowerCase().trim().replace(/\s/g, '') : "");
            publicationFound = publicationFoundCrossRef;
            //console.log(publicationFound)
          })
        }


        //αν η συνθήκη είναι true σημαίνει ότι βρέθηκε η δημοσίευση στο crossRef οπότε θα προχωρήσουμε στην προσθήκη του αντικειμένου Publicatio και typePublication στη βάση
        if (publicationsTitle.some(s => publication.title.toLowerCase().trim().replace(/\s/g, '').includes(s))) {




          //Σετάρισμα του τύπου της δημοσίευσης
          let sectionToSet;
          if (publicationFound.type === 'journal-article') {
            sectionToSet = 'Article'
          }

          else if (publicationFound.type === 'book-chapter') {
            sectionToSet = 'Book_Chapter'
          }

          else if (publicationFound.type === 'book' || publicationFound.type === 'book-series') {
            sectionToSet = 'Book'
          }

          else if (publicationFound.type === 'proceedings-article' || publicationFound.type === 'proceedings' || publicationFound.type === 'proceedings-series') {
            sectionToSet = 'Proceedings'
          }

          else if (publicationFound.type === 'report' || publicationFound.type === 'report-component' || publicationFound.type === 'report-series') {
            sectionToSet = 'Tech_Report'
          }

          else if (publicationFound.type === 'dissertation') {
            sectionToSet = 'Thesis'
          }

          else {
            sectionToSet = 'Other'
          }

          //Σετάρισμα του ISBN αν υπάρχει
          let isbnToSet;
          if (publicationFound.ISBN) {
            if (publicationFound.ISBN.length === 2) {
              isbnToSet = publicationFound.ISBN[1];
              console.log(publicationFound.ISBN[1])
            }
            else if (publicationFound.ISBN.length === 1) {
              isbnToSet = publicationFound.ISBN[0]
            }

          } else {
            isbnToSet = null
          }


          //Σετάρισμα χρονιάς αν υπάρχει
          let yearToSet;

          if (publicationFound.published) {
            yearToSet = publicationFound.published['date-parts'][0][0]
            console.log(publicationFound.published['date-parts'][0][0])
          }

          else {
            yearToSet = null
          }

          //Δημιουργία αντικειμένου publication 

          let abstractToSet;

          if (publication.abstract) {
            abstractToSet = publication.abstract;
          }

          else if (publicationFound.abstract) {
            abstractToSet = publicationFound.abstract
          }

          else {
            abstractToSet = null
          }

          publicationFullObj = {
            title: publication.title,
            section: sectionToSet,
            abstract: abstractToSet,
            isbn: isbnToSet,
            year: yearToSet,
            doi: publicationFound.DOI ? publicationFound.DOI : null,
          }

          console.log(publicationFullObj)

          const createdPublication = await Publication.create(publicationFullObj, { include: [Article, Book, Proceeding, Thesis, ChapterBk, TechReport] });

          // Find the user from the database based on the userData object stored in the request
          const userCreator = await User.findOne({ where: { user_id: req.userData.userId } });

          // Connect the created publication with the current user
          await createdPublication.setUser(userCreator);

          //add authors
          await createdPublication.addInternalAuthors(userCreator);

          //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
          const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
          const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

          //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
          createdPublication.addPublicationcategories(allCategoryFound);
          createdPublication.addPublicationcategories(uncategorizedFound);


          //Δημιουργία αντικειμένου για στατιστικά
          const publicationStatsObj = {
            citations: 0,
            references: 0,
            num_of_exported_presentation_file: 0,
            num_of_exported_content_file: 0,
            reqs_of_exported_presentation_file: 0,
            reqs_of_exported_content_file: 0,
          }
          //Αποθήκευση αντικειμένου για στατιστικά στην Βάση
          const publicationStats = await PublicationStats.create(publicationStatsObj);
          //συσχέτιση αντικειμένου publicationStat με την Δημοσίευση που δημιουργήσαμε 
          await createdPublication.setPublicationStat(publicationStats);


          switch (sectionToSet) {


            case 'Article':

              let jurnalToSet;
              if (publicationFound['short-container-title'][0]) {
                jurnalToSet = publicationFound['short-container-title'][0];
              }
              else if (publicationFound['container-title'][0]) {
                jurnalToSet = publicationFound['container-title'][0];
              }
              else {
                jurnalToSet = ""
              }

              sectionCreated = {
                jurnal: jurnalToSet,
                number: publicationFound.issue ? publicationFound.issue : null,
                volume: publicationFound.volume ? publicationFound.volume : null,
                pages: publicationFound.page ? publicationFound.page : null,
                month: publicationFound.month ? publicationFound.month : 'Not Defined'
              }

              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const article1 = await Article.create(sectionCreated)
              publicationType = article1;
              await createdPublication.setArticle(article1)
              sectionId = article1.article_id;

              console.log(sectionCreated)

              break;

            case 'Book_Chapter':

              let chapterToSet;

              if (publicationFound['container-title']) {
                chapterToSet = publicationFound['container-title'][0]
              }
              else {
                chapterToSet = ""
              }

              sectionCreated = {
                chapter: chapterToSet,
                publisher: publicationFound.publisher ? publicationFound.publisher : "",
                pages: publicationFound.page ? publicationFound.page : "",
                volume: publicationFound['edition-number'] ? publicationFound['edition-number'] : null,
                series: publicationFound.series ? publicationFound.series : null,
                type: 'Book_Chapter'
              }
              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const bookCpt1 = await ChapterBk.create(sectionCreated)
              publicationType = bookCpt1;
              await createdPublication.setChapterBk(bookCpt1)
              sectionId = bookCpt1.book_chapter_id;
              break;

              break;

            case 'Book':

              let publisherToSet;
              if (publicationFound.publisher) {
                publisherToSet = publicationFound.publisher
              }
              else {
                publisherToSet = ""
              }

              console.log(publicationFound)
              sectionCreated = {
                publisher: publisherToSet,
                number: publicationFound.issue ? publicationFound.issue : null,
                volume: publicationFound.volume ? publicationFound.volume : null,
                pages: publicationFound.page ? publicationFound.pages : null,
                month: publicationFound.month ? publicationFound.month : 'Not Defined',
                series: publicationFound.series ? publicationFound.series : null,
                address: publicationFound.address ? publicationFound.address : null,
                version: publicationFound.version ? publicationFound.version : null,
              }
              console.log(sectionCreated)
              console.log(publicationFound.issued['date-parts']);

              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const book1 = await Book.create(sectionCreated)
              publicationType = book1;
              await createdPublication.setBook(book1)
              sectionId = book1.book_id;

              break;


            case 'Proceedings':


              let monthToSet = 'Not Defined';
              if (publicationFound.published) {
                let monthNumber = publicationFound.published['date-parts'][0][1];

                switch (monthNumber) {

                  case 1:
                    monthToSet = 'January'
                    break;

                  case 2:
                    monthToSet = 'February';
                    break;
                  case 3:
                    monthToSet = 'March';
                    break;
                  case 4:
                    monthToSet = 'April';
                    break;
                  case 5:
                    monthToSet = 'May';
                    break;
                  case 6:
                    monthToSet = 'June';
                    break;
                  case 7:
                    monthToSet = 'July';
                    break;
                  case 8:
                    monthToSet = 'August';
                    break;
                  case 9:
                    monthToSet = 'September';
                    break;
                  case 10:
                    monthToSet = 'October';
                    break;
                  case 11:
                    monthToSet = 'November';
                    break;
                  case 12:
                    monthToSet = 'December';
                    break;

                }
              }


              let editorToSet;
              if (publicationFound.publisher) {
                editorToSet = publicationFound.publisher
              }
              else {
                editorToSet = ""
              }

              sectionCreated = {
                editor: editorToSet,
                number: publicationFound.issue ? publicationFound.issue : null,
                volume: publicationFound.volume ? publicationFound.volume : null,
                pages: publicationFound.page ? publicationFound.pages : null,
                month: monthToSet,
                organization: publicationFound.publisher ? publicationFound.publisher : null,
                address: publicationFound.event.location ? publicationFound.event.location : null,
                publisher: publicationFound.publisher ? publicationFound.publisher : null,
              }
              console.log(sectionCreated)

              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const proceeding1 = await Proceeding.create(sectionCreated)
              publicationType = proceeding1;
              await createdPublication.setProceeding(proceeding1)
              sectionId = proceeding1.proceeding_id;
              break;


            case 'Tech_Report':

              let institutionToSet;
              console.log(publicationFound)
              if (publicationFound.institution && publicationFound.institution.length > 0) {
                institutionToSet = publicationFound.institution[0]['name']
              }
              else {
                institutionToSet = ""
              }

              let monthToSett = "Not Defined";
              if (publicationFound.published['date-parts']) {
                let monthNumber = publicationFound.published['date-parts'][0][1];

                switch (monthNumber) {

                  case 1:
                    monthToSett = 'January'
                    break;

                  case 2:
                    monthToSett = 'February';
                    break;
                  case 3:
                    monthToSett = 'March';
                    break;
                  case 4:
                    monthToSett = 'April';
                    break;
                  case 5:
                    monthToSett = 'May';
                    break;
                  case 6:
                    monthToSett = 'June';
                    break;
                  case 7:
                    monthToSett = 'July';
                    break;
                  case 8:
                    monthToSett = 'August';
                    break;
                  case 9:
                    monthToSett = 'September';
                    break;
                  case 10:
                    monthToSett = 'October';
                    break;
                  case 11:
                    monthToSett = 'November';
                    break;
                  case 12:
                    monthToSett = 'December';
                    break;

                }
              }


              sectionCreated = {
                institution: institutionToSet,
                address: response.data.message['publisher-location'] ? response.data.message['publisher-location'] : null,
                month: monthToSett,
                tech_report_year: publication.year,
                type: response.data.message.type,
              }

              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const techReport1 = await TechReport.create(sectionCreated)
              publicationType = techReport1;
              await createdPublication.setTechReport(techReport1)
              sectionId = techReport1.tech_report_id;


              console.log(sectionCreated)
              break;


            case 'Thesis':

              let schoolToSet;
              if (publicationFound.institution) {
                schoolToSet = publicationFound.institution[0]['name']
              }
              else {
                schoolToSet = ""
              }

              let degreeToSet = 'Other';
              if (publicationFound.degree) {
                if (publicationFound.degree[0].toLowerCase().includes('master')) {
                  degreeToSet = 'Master'
                }
                else if (publicationFound.degree[0].toLowerCase().includes('phd')) {
                  degreeToSet = 'PhD'
                }
                else {
                  degreeToSet = 'Other';
                }
              }


              console.log(publicationFound.deposited['date-parts']);

              let monthToSet2 = 'Not Defined';
              if (publicationFound.deposited) {
                let monthNumber = publicationFound.deposited['date-parts'][0][1];

                switch (monthNumber) {

                  case 1:
                    monthToSet2 = 'January'
                    break;

                  case 2:
                    monthToSet2 = 'February';
                    break;
                  case 3:
                    monthToSet2 = 'March';
                    break;
                  case 4:
                    monthToSet2 = 'April';
                    break;
                  case 5:
                    monthToSet2 = 'May';
                    break;
                  case 6:
                    monthToSet2 = 'June';
                    break;
                  case 7:
                    monthToSet2 = 'July';
                    break;
                  case 8:
                    monthToSet2 = 'August';
                    break;
                  case 9:
                    monthToSet2 = 'September';
                    break;
                  case 10:
                    monthToSet2 = 'October';
                    break;
                  case 11:
                    monthToSet2 = 'November';
                    break;
                  case 12:
                    monthToSet2 = 'December';
                    break;

                }
              }
              sectionCreated = {
                school: schoolToSet,
                type: degreeToSet,
                month: monthToSet2,
                address: publicationFound.publisher ? publicationFound.publisher : null,

              }

              const thesis1 = await Thesis.create(sectionCreated)
              publicationType = thesis1;
              await createdPublication.setThesis(thesis1)
              sectionId = thesis1.thesis_id;

              break;


            default:


              break;
          }


          res.status(200).json({
            message: 'Publication added successfully!'
          })





        }


        //Διαφορετικά θα γίνει εισαγωγή της Δημοσίευσης με βάση την γενική κατηγορία other
        else {

          publicationFullObj = {
            title: publication.title,
            section: 'Other',
            abstract: publication.abstract
          }

          const createdPublication = await Publication.create(publicationFullObj, { include: [Article, Book, Proceeding, Thesis, ChapterBk, TechReport] });

          // Find the user from the database based on the userData object stored in the request
          const userCreator = await User.findOne({ where: { user_id: req.userData.userId } });

          // Connect the created publication with the current user
          await createdPublication.setUser(userCreator);

          res.status(200).json({
            message: 'Publication added successfully!'
          })

        }


      } catch (err) {
        res.status(404).json({
          message: 'Something went wrong.\n Please double-check the identifier you provided to ensure its accuracy'
        })
      }




    }

    //Διαφορετικά στέλνουμε στον χρήστη να ελέγξει την εισαγωγή του
    else {
      res.status(404).json({
        message: 'Something went wrong.\n Please double-check the identifier you provided to ensure its accuracy'
      })
    }

    console.log(publication)



  }

  else if (identifier === 'Title') {

    const title = req.body.inputSearch

    let publications = [];


    const url = `https://api.crossref.org/works`

    //const result = await axios.get(`https://serpapi.com/search?q=${title}&engine=google_scholar&num=10&api_key=${"60ec0fe2a88b7554ba64c60de952913a1019bd4825d0f0973682786921859ee9"}`)

    const publicationsFoundFromCrossRef = await axios.get(url, { params: { query: title, rows: '10' } });




    if (publicationsFoundFromCrossRef.data) {

      let sectionWord;
      publicationsFoundFromCrossRef.data.message.items.map(publicationFound => {

        //Σετάρισμα του τύπου της δημοσίευσης
        let sectionToSet;
        if (publicationFound.type === 'journal-article') {
          sectionWord = 'article'
          sectionToSet = 'Article'
        }

        else if (publicationFound.type === 'book-chapter') {
          sectionWord = 'chapterBk'

          sectionToSet = 'Book_Chapter'
        }

        else if (publicationFound.type === 'book' || publicationFound.type === 'book-series') {
          sectionWord = 'book'

          sectionToSet = 'Book'
        }

        else if (publicationFound.type === 'proceedings-article' || publicationFound.type === 'proceedings' || publicationFound.type === 'proceedings-series') {
          sectionWord = 'proceedings'

          sectionToSet = 'Proceedings'
        }

        else if (publicationFound.type === 'report' || publicationFound.type === 'report-component' || publicationFound.type === 'report-series') {
          sectionWord = 'techReport'

          sectionToSet = 'Tech_Report'
        }

        else if (publicationFound.type === 'dissertation') {
          sectionWord = 'thesis'
          sectionToSet = 'Thesis'
        }

        else {
          sectionWord = 'other'

          sectionToSet = 'Other'
        }

        //Σετάρισμα του ISBN αν υπάρχει
        let isbnToSet;
        if (publicationFound.ISBN) {
          if (publicationFound.ISBN.length === 2) {
            isbnToSet = publicationFound.ISBN[1];
            console.log(publicationFound.ISBN[1])
          }
          else if (publicationFound.ISBN.length === 1) {
            isbnToSet = publicationFound.ISBN[0]
          }
        } else {
          isbnToSet = null
        }


        //Σετάρισμα χρονιάς αν υπάρχει
        let yearToSet;
        if (publicationFound.published) {
          yearToSet = publicationFound.published['date-parts'][0][0]
          console.log(publicationFound.published['date-parts'][0][0])
        }

        else {
          yearToSet = null
        }

        //Δημιουργία αντικειμένου publication 
        let abstractToSet;
        if (publicationFound.abstract) {
          abstractToSet = publicationFound.abstract;
        }
        else {
          abstractToSet = null
        }




        switch (sectionToSet) {


          case 'Article':

            let jurnalToSet;
            if (publicationFound['short-container-title']) {
              jurnalToSet = publicationFound['short-container-title'][0];
            }
            else if (publicationFound['container-title']) {
              jurnalToSet = publicationFound['container-title'][0];
            }
            else {
              jurnalToSet = ""
            }

            sectionCreated = {
              jurnal: jurnalToSet,
              number: publicationFound.issue ? publicationFound.issue : null,
              volume: publicationFound.volume ? publicationFound.volume : null,
              pages: publicationFound.page ? publicationFound.page : null,
              month: publicationFound.month ? publicationFound.month : 'Not Defined'
            }


            break;

          case 'Book_Chapter':

            let chapterToSet;

            if (publicationFound['container-title']) {
              chapterToSet = publicationFound['container-title'][0]
            }
            else {
              chapterToSet = ""
            }

            sectionCreated = {
              chapter: chapterToSet ? chapterToSet : "",
              publisher: publicationFound.publisher ? publicationFound.publisher : "",
              pages: publicationFound.page ? publicationFound.page : "",
              volume: publicationFound['edition-number'] ? publicationFound['edition-number'] : null,
              series: publicationFound.series ? publicationFound.series : null,
              type: 'Book_Chapter'
            }
            break;

          case 'Book':

            let publisherToSet;
            if (publicationFound.publisher) {
              publisherToSet = publicationFound.publisher
            }
            else {
              publisherToSet = ""
            }

            console.log(publicationFound)
            sectionCreated = {
              publisher: publisherToSet,
              number: publicationFound.issue ? publicationFound.issue : null,
              volume: publicationFound.volume ? publicationFound.volume : null,
              pages: publicationFound.page ? publicationFound.pages : null,
              month: publicationFound.month ? publicationFound.month : 'Not Defined',
              series: publicationFound.series ? publicationFound.series : null,
              address: publicationFound.address ? publicationFound.address : null,
              version: publicationFound.version ? publicationFound.version : null,
            }
            break;


          case 'Proceedings':


            let monthToSet = 'Not Defined';
            if (publicationFound.published) {
              let monthNumber = publicationFound.published['date-parts'][0][1];

              switch (monthNumber) {

                case 1:
                  monthToSet = 'January'
                  break;

                case 2:
                  monthToSet = 'February';
                  break;
                case 3:
                  monthToSet = 'March';
                  break;
                case 4:
                  monthToSet = 'April';
                  break;
                case 5:
                  monthToSet = 'May';
                  break;
                case 6:
                  monthToSet = 'June';
                  break;
                case 7:
                  monthToSet = 'July';
                  break;
                case 8:
                  monthToSet = 'August';
                  break;
                case 9:
                  monthToSet = 'September';
                  break;
                case 10:
                  monthToSet = 'October';
                  break;
                case 11:
                  monthToSet = 'November';
                  break;
                case 12:
                  monthToSet = 'December';
                  break;

              }
            }


            let editorToSet;
            if (publicationFound.publisher) {
              editorToSet = publicationFound.publisher
            }
            else {
              editorToSet = ""
            }

            sectionCreated = {
              editor: editorToSet,
              number: publicationFound.issue ? publicationFound.issue : null,
              volume: publicationFound.volume ? publicationFound.volume : null,
              pages: publicationFound.page ? publicationFound.pages : null,
              month: monthToSet,
              organization: publicationFound.publisher ? publicationFound.publisher : null,
              address: publicationFound.event.location ? publicationFound.event.location : null,
              publisher: publicationFound.publisher ? publicationFound.publisher : null,
            }
            break;


          case 'Tech_Report':

            let institutionToSet;
            console.log(publicationFound)
            if (publicationFound.institution && publicationFound.institution.length > 0) {
              institutionToSet = publicationFound.institution[0]['name']
            }
            else {
              institutionToSet = ""
            }

            let monthToSett = "Not Defined";
            if (publicationFound.published['date-parts']) {
              let monthNumber = publicationFound.published['date-parts'][0][1];

              switch (monthNumber) {

                case 1:
                  monthToSett = 'January'
                  break;

                case 2:
                  monthToSett = 'February';
                  break;
                case 3:
                  monthToSett = 'March';
                  break;
                case 4:
                  monthToSett = 'April';
                  break;
                case 5:
                  monthToSett = 'May';
                  break;
                case 6:
                  monthToSett = 'June';
                  break;
                case 7:
                  monthToSett = 'July';
                  break;
                case 8:
                  monthToSett = 'August';
                  break;
                case 9:
                  monthToSett = 'September';
                  break;
                case 10:
                  monthToSett = 'October';
                  break;
                case 11:
                  monthToSett = 'November';
                  break;
                case 12:
                  monthToSett = 'December';
                  break;

              }
            }


            sectionCreated = {
              institution: institutionToSet,
              address: publicationFound['publisher-location'] ? publicationFound['publisher-location'] : null,
              month: monthToSett,
              tech_report_year: yearToSet,
              type: publicationFound.type,
            }

            break;


          case 'Thesis':

            let schoolToSet;
            if (publicationFound.institution) {
              schoolToSet = publicationFound.institution[0]['name']
            }
            else {
              schoolToSet = ""
            }

            let degreeToSet = 'Other';
            if (publicationFound.degree) {
              if (publicationFound.degree[0].toLowerCase().includes('master')) {
                degreeToSet = 'Master'
              }
              else if (publicationFound.degree[0].toLowerCase().includes('phd')) {
                degreeToSet = 'PhD'
              }
              else {
                degreeToSet = 'Other';
              }
            }




            let monthToSet2 = 'Not Defined';
            if (publicationFound.deposited) {
              let monthNumber = publicationFound.deposited['date-parts'][0][1];

              switch (monthNumber) {

                case 1:
                  monthToSet2 = 'January'
                  break;

                case 2:
                  monthToSet2 = 'February';
                  break;
                case 3:
                  monthToSet2 = 'March';
                  break;
                case 4:
                  monthToSet2 = 'April';
                  break;
                case 5:
                  monthToSet2 = 'May';
                  break;
                case 6:
                  monthToSet2 = 'June';
                  break;
                case 7:
                  monthToSet2 = 'July';
                  break;
                case 8:
                  monthToSet2 = 'August';
                  break;
                case 9:
                  monthToSet2 = 'September';
                  break;
                case 10:
                  monthToSet2 = 'October';
                  break;
                case 11:
                  monthToSet2 = 'November';
                  break;
                case 12:
                  monthToSet2 = 'December';
                  break;

              }
            }
            sectionCreated = {
              school: schoolToSet,
              type: degreeToSet,
              month: monthToSet2,
              address: publicationFound.publisher ? publicationFound.publisher : null,

            }
            break;


          default:


            break;
        }


        let linkToSet;
        if (publicationFound.resource.primary) {
          linkToSet = publicationFound.resource.primary.URL
        }
        else {
          linkToSet = ""
        }



        switch (sectionToSet) {
          case 'Article':
            publicationFullObj = {
              title: publicationFound.title[0],
              link: linkToSet,
              type: sectionToSet,
              abstract: abstractToSet,
              isbn: isbnToSet,
              year: yearToSet,
              doi: publicationFound.DOI ? publicationFound.DOI : null,
              article: sectionCreated
            }
            break;

          case 'Book_Chapter':
            publicationFullObj = {
              title: publicationFound.title[0],
              link: linkToSet,
              type: sectionToSet,
              abstract: abstractToSet,
              isbn: isbnToSet,
              year: yearToSet,
              doi: publicationFound.DOI ? publicationFound.DOI : null,
              chapterBk: sectionCreated
            }
            break;

          case 'Book':
            publicationFullObj = {
              title: publicationFound.title[0],
              link: linkToSet,
              type: sectionToSet,
              abstract: abstractToSet,
              isbn: isbnToSet,
              year: yearToSet,
              doi: publicationFound.DOI ? publicationFound.DOI : null,
              book: sectionCreated
            }
            break;

          case 'Proceedings':

            publicationFullObj = {
              title: publicationFound.title[0],
              link: linkToSet,
              type: sectionToSet,
              abstract: abstractToSet,
              isbn: isbnToSet,
              year: yearToSet,
              doi: publicationFound.DOI ? publicationFound.DOI : null,
              proceedings: sectionCreated
            }
            break;

          case 'Tech_Report':
            publicationFullObj = {
              title: publicationFound.title[0],
              link: linkToSet,
              type: sectionToSet,
              abstract: abstractToSet,
              isbn: isbnToSet,
              year: yearToSet,
              doi: publicationFound.DOI ? publicationFound.DOI : null,
              techReport: sectionCreated
            }
            break;

          case 'Thesis':
            publicationFullObj = {
              title: publicationFound.title[0],
              link: linkToSet,
              type: sectionToSet,
              abstract: abstractToSet,
              isbn: isbnToSet,
              year: yearToSet,
              doi: publicationFound.DOI ? publicationFound.DOI : null,
              thesis: sectionCreated
            }
            break;
        }


        console.log(publicationFullObj)

        publications.push(publicationFullObj)

      })


      res.status(200).json({
        message: 'Found many publications',
        publications: publications
      })

    }

    else {
      res.status(404).json({
        message: 'Something went wrong.\n Please double-check the identifier you provided to ensure its accuracy'
      })
    }






  }

  else {


    let publicationsISBN = [];
    let publicationCrossRefObj = [];
    let sectionsToSent = [];
    let publicationFound;
    const urlSearch = `https://api.crossref.org/works?filter=isbn:${req.body.inputSearch}`
    let publicationsFound = await axios.get(urlSearch).catch(err => {

      console.log("ERROR ON ISBN")
      return;

    });


    //console.log(publicationsFound)
    //Ελέγχουμε αν το αποτέλεσματ απο το request στο corssref api υπάρχει
    if (publicationsFound.data) {

      publicationsFound.data.message.items.map(publicationFoundCrossRef => {
        //console.log(publicationFoundCrossRef)

        //Σετάρισμα χρονιάς αν υπάρχει
        let yearToSet;
        if (publicationFoundCrossRef.published) {
          yearToSet = publicationFoundCrossRef.published['date-parts'][0][0]
          //console.log(publicationFoundCrossRef.published['date-parts'][0][0])
        }
        else {
          yearToSet = null
        }


        let linkToSet;
        if (publicationFoundCrossRef.resource.primary) {
          linkToSet = publicationFoundCrossRef.resource.primary.URL
        }
        else {
          linkToSet = ""
        }


        //Σετάρισμα του τύπου της δημοσίευσης
        let sectionToSet;
        if (publicationFoundCrossRef.type === 'journal-article') {
          sectionToSet = 'Article'
        }

        else if (publicationFoundCrossRef.type === 'book-chapter') {
          sectionToSet = 'Book_Chapter'
        }

        else if (publicationFoundCrossRef.type === 'book' || publicationFoundCrossRef.type === 'book-series') {
          sectionToSet = 'Book'
        }

        else if (publicationFoundCrossRef.type === 'proceedings-article' || publicationFoundCrossRef.type === 'proceedings' || publicationFoundCrossRef.type === 'proceedings-series') {
          sectionToSet = 'Proceedings'
        }

        else if (publicationFoundCrossRef.type === 'report' || publicationFoundCrossRef.type === 'report-component' || publicationFoundCrossRef.type === 'report-series') {
          sectionToSet = 'Tech_Report'
        }

        else if (publicationFoundCrossRef.type === 'dissertation') {
          sectionToSet = 'Thesis'
        }

        else {
          sectionToSet = 'Other'
        }



        //Σετάρισμα του ISBN αν υπάρχει
        let isbnToSet;
        if (publicationFoundCrossRef.ISBN) {
          if (publicationFoundCrossRef.ISBN.length === 2) {
            isbnToSet = publicationFoundCrossRef.ISBN[1];
            console.log(publicationFoundCrossRef.ISBN[1])
          }
          else if (publicationFoundCrossRef.ISBN.length === 1) {
            isbnToSet = publicationFoundCrossRef.ISBN[0]
          }

        } else {
          isbnToSet = null
        }



        let doiToSet;
        console.log("DOI ", publicationFoundCrossRef.DOI)
        if (publicationFoundCrossRef.DOI) {
          doiToSet = publicationFoundCrossRef.DOI
        }
        else {
          doiToSet = null
        }



        let abstractToSet;
        if (publicationFoundCrossRef.abstract) {
          abstractToSet = publicationFoundCrossRef.abstract;
        }
        else {
          abstractToSet = null
        }


        switch (sectionToSet) {


          case 'Article':

            let jurnalToSet;
            if (publicationFoundCrossRef['short-container-title'][0]) {
              jurnalToSet = publicationFoundCrossRef['short-container-title'][0];
            }
            else if (publicationFoundCrossRef['container-title'][0]) {
              jurnalToSet = publicationFoundCrossRef['container-title'][0];
            }
            else {
              jurnalToSet = ""
            }

            sectionCreated = {
              jurnal: jurnalToSet,
              number: publicationFoundCrossRef.issue ? publicationFoundCrossRef.issue : null,
              volume: publicationFoundCrossRef.volume ? publicationFoundCrossRef.volume : null,
              pages: publicationFoundCrossRef.page ? publicationFoundCrossRef.page : null,
              month: publicationFoundCrossRef.month ? publicationFoundCrossRef.month : 'Not Defined'
            }
            sectionsToSent.push(sectionCreated)
            console.log(sectionCreated)

            break;

          case 'Book_Chapter':

            let chapterToSet;

            if (publicationFoundCrossRef['container-title']) {
              chapterToSet = publicationFoundCrossRef['container-title'][0]
            }
            else {
              chapterToSet = ""
            }

            sectionCreated = {
              chapter: chapterToSet,
              publisher: publicationFoundCrossRef.publisher ? publicationFoundCrossRef.publisher : "",
              pages: publicationFoundCrossRef.page ? publicationFoundCrossRef.page : "",
              volume: publicationFoundCrossRef['edition-number'] ? publicationFoundCrossRef['edition-number'] : null,
              series: publicationFoundCrossRef.series ? publicationFoundCrossRef.series : null,
              type: 'Book_Chapter'
            }
            sectionsToSent.push(sectionCreated)
            break;

          case 'Book':

            let publisherToSet;
            if (publicationFoundCrossRef.publisher) {
              publisherToSet = publicationFoundCrossRef.publisher
            }
            else {
              publisherToSet = ""
            }

            console.log(publicationFoundCrossRef)
            sectionCreated = {
              publisher: publisherToSet,
              number: publicationFoundCrossRef.issue ? publicationFoundCrossRef.issue : null,
              volume: publicationFoundCrossRef.volume ? publicationFoundCrossRef.volume : null,
              pages: publicationFoundCrossRef.page ? publicationFoundCrossRef.pages : null,
              month: publicationFoundCrossRef.month ? publicationFoundCrossRef.month : 'Not Defined',
              series: publicationFoundCrossRef.series ? publicationFoundCrossRef.series : null,
              address: publicationFoundCrossRef.address ? publicationFoundCrossRef.address : null,
              version: publicationFoundCrossRef.version ? publicationFoundCrossRef.version : null,
            }
            console.log(sectionCreated)
            console.log(publicationFoundCrossRef.issued['date-parts']);
            sectionsToSent.push(sectionCreated)
            break;


          case 'Proceedings':


            let monthToSet = 'Not Defined';
            if (publicationFoundCrossRef.published) {
              let monthNumber = publicationFoundCrossRef.published['date-parts'][0][1];

              switch (monthNumber) {

                case 1:
                  monthToSet = 'January'
                  break;

                case 2:
                  monthToSet = 'February';
                  break;
                case 3:
                  monthToSet = 'March';
                  break;
                case 4:
                  monthToSet = 'April';
                  break;
                case 5:
                  monthToSet = 'May';
                  break;
                case 6:
                  monthToSet = 'June';
                  break;
                case 7:
                  monthToSet = 'July';
                  break;
                case 8:
                  monthToSet = 'August';
                  break;
                case 9:
                  monthToSet = 'September';
                  break;
                case 10:
                  monthToSet = 'October';
                  break;
                case 11:
                  monthToSet = 'November';
                  break;
                case 12:
                  monthToSet = 'December';
                  break;

              }
            }


            let editorToSet;
            if (publicationFoundCrossRef.publisher) {
              editorToSet = publicationFoundCrossRef.publisher
            }
            else {
              editorToSet = ""
            }

            sectionCreated = {
              editor: editorToSet,
              number: publicationFoundCrossRef.issue ? publicationFoundCrossRef.issue : null,
              volume: publicationFoundCrossRef.volume ? publicationFoundCrossRef.volume : null,
              pages: publicationFoundCrossRef.page ? publicationFoundCrossRef.pages : null,
              month: monthToSet,
              organization: publicationFoundCrossRef.publisher ? publicationFoundCrossRef.publisher : null,
              address: publicationFoundCrossRef.event.location ? publicationFoundCrossRef.event.location : null,
              publisher: publicationFoundCrossRef.publisher ? publicationFoundCrossRef.publisher : null,
            }
            sectionsToSent.push(sectionCreated)
            console.log(sectionCreated)
            break;


          case 'Tech_Report':

            let institutionToSet;
            console.log(publicationFoundCrossRef)
            if (publicationFoundCrossRef.institution && publicationFoundCrossRef.institution.length > 0) {
              institutionToSet = publicationFoundCrossRef.institution[0]['name']
            }
            else {
              institutionToSet = ""
            }

            let monthToSett = "Not Defined";
            if (publicationFoundCrossRef.published['date-parts']) {
              let monthNumber = publicationFoundCrossRef.published['date-parts'][0][1];

              switch (monthNumber) {

                case 1:
                  monthToSett = 'January'
                  break;

                case 2:
                  monthToSett = 'February';
                  break;
                case 3:
                  monthToSett = 'March';
                  break;
                case 4:
                  monthToSett = 'April';
                  break;
                case 5:
                  monthToSett = 'May';
                  break;
                case 6:
                  monthToSett = 'June';
                  break;
                case 7:
                  monthToSett = 'July';
                  break;
                case 8:
                  monthToSett = 'August';
                  break;
                case 9:
                  monthToSett = 'September';
                  break;
                case 10:
                  monthToSett = 'October';
                  break;
                case 11:
                  monthToSett = 'November';
                  break;
                case 12:
                  monthToSett = 'December';
                  break;

              }
            }


            sectionCreated = {
              institution: institutionToSet,
              address: response.data.message['publisher-location'] ? response.data.message['publisher-location'] : null,
              month: monthToSett,
              tech_report_year: publicationFoundCrossRef.year,
              type: response.data.message.type,
            }
            sectionsToSent.push(sectionCreated)
            console.log(sectionCreated)
            break;


          case 'Thesis':

            let schoolToSet;
            if (publicationFoundCrossRef.institution) {
              schoolToSet = publicationFoundCrossRef.institution[0]['name']
            }
            else {
              schoolToSet = ""
            }

            let degreeToSet = 'Other';
            if (publicationFoundCrossRef.degree) {
              if (publicationFoundCrossRef.degree[0].toLowerCase().includes('master')) {
                degreeToSet = 'Master'
              }
              else if (publicationFoundCrossRef.degree[0].toLowerCase().includes('phd')) {
                degreeToSet = 'PhD'
              }
              else {
                degreeToSet = 'Other';
              }
            }


            console.log(publicationFoundCrossRef.deposited['date-parts']);

            let monthToSet2 = 'Not Defined';
            if (publicationFoundCrossRef.deposited) {
              let monthNumber = publicationFoundCrossRef.deposited['date-parts'][0][1];

              switch (monthNumber) {

                case 1:
                  monthToSet2 = 'January'
                  break;

                case 2:
                  monthToSet2 = 'February';
                  break;
                case 3:
                  monthToSet2 = 'March';
                  break;
                case 4:
                  monthToSet2 = 'April';
                  break;
                case 5:
                  monthToSet2 = 'May';
                  break;
                case 6:
                  monthToSet2 = 'June';
                  break;
                case 7:
                  monthToSet2 = 'July';
                  break;
                case 8:
                  monthToSet2 = 'August';
                  break;
                case 9:
                  monthToSet2 = 'September';
                  break;
                case 10:
                  monthToSet2 = 'October';
                  break;
                case 11:
                  monthToSet2 = 'November';
                  break;
                case 12:
                  monthToSet2 = 'December';
                  break;

              }
            }
            sectionCreated = {
              school: schoolToSet,
              type: degreeToSet,
              month: monthToSet2,
              address: publicationFoundCrossRef.publisher ? publicationFoundCrossRef.publisher : null,

            }
            sectionsToSent.push(sectionCreated)
            break;


          default:


            break;
        }




        switch (sectionToSet.section) {

          case 'Article':
            let publicationToAdd1 = {
              title: publicationFoundCrossRef.title ? publicationFoundCrossRef.title[0] : "",
              year: yearToSet,
              link: linkToSet,
              type: sectionToSet,
              isbn: isbnToSet,
              doi: doiToSet,
              article: sectionCreated
            }
            publicationsISBN.push(publicationToAdd1)
            publicationCrossRefObj.push(publicationFoundCrossRef)
            break;

          case 'Book':
            let publicationToAdd2 = {
              title: publicationFoundCrossRef.title ? publicationFoundCrossRef.title[0] : "",
              year: yearToSet,
              link: linkToSet,
              type: sectionToSet,
              isbn: isbnToSet,
              doi: doiToSet,
              book: sectionCreated
            }
            publicationsISBN.push(publicationToAdd2)
            publicationCrossRefObj.push(publicationFoundCrossRef)
            break;

          case 'Proceedings':
            let publicationToAdd3 = {
              title: publicationFoundCrossRef.title ? publicationFoundCrossRef.title[0] : "",
              year: yearToSet,
              link: linkToSet,
              type: sectionToSet,
              isbn: isbnToSet,
              doi: doiToSet,
              proceedings: sectionCreated
            }
            publicationsISBN.push(publicationToAdd3)
            publicationCrossRefObj.push(publicationFoundCrossRef)
            break;

          case 'Thesis':
            let publicationToAdd4 = {
              title: publicationFoundCrossRef.title ? publicationFoundCrossRef.title[0] : "",
              year: yearToSet,
              link: linkToSet,
              type: sectionToSet,
              isbn: isbnToSet,
              doi: doiToSet,
              thesis: sectionCreated
            }
            publicationsISBN.push(publicationToAdd4)
            publicationCrossRefObj.push(publicationFoundCrossRef)
            break;

          case 'Book_Chapter':
            let publicationToAdd5 = {
              title: publicationFoundCrossRef.title ? publicationFoundCrossRef.title[0] : "",
              year: yearToSet,
              link: linkToSet,
              type: sectionToSet,
              isbn: isbnToSet,
              doi: doiToSet,
              chapterBk: sectionCreated
            }
            publicationsISBN.push(publicationToAdd5)
            publicationCrossRefObj.push(publicationFoundCrossRef)
            break;

          case 'Tech_Report':
            let publicationToAdd6 = {
              title: publicationFoundCrossRef.title ? publicationFoundCrossRef.title[0] : "",
              year: yearToSet,
              link: linkToSet,
              type: sectionToSet,
              isbn: isbnToSet,
              doi: doiToSet,
              techReport: sectionCreated
            }
            publicationsISBN.push(publicationToAdd6)
            publicationCrossRefObj.push(publicationFoundCrossRef)
            break;

          case 'Other':
            let publicationToAdd7 = {
              title: publicationFoundCrossRef.title ? publicationFoundCrossRef.title[0] : "",
              year: yearToSet,
              link: linkToSet,
              type: sectionToSet,
              isbn: isbnToSet,
              doi: doiToSet,
              other: sectionCreated
            }
            publicationsISBN.push(publicationToAdd7)
            publicationCrossRefObj.push(publicationFoundCrossRef)
            break;

        }


      })
      console.log(publicationCrossRefObj);
      console.log(publicationsISBN);


      //αν το μέγεθος του πίνακα των αποτελεσμάτων είναι μεγαλύτερο του 1 τότε σημαίνει ότι βρέθηκα πολλά αποτελέσματα οπότε θα τα εμφανίσουμε στον client να επιλέξει εκεί ο χρήστης
      if (publicationsISBN.length > 0) {

        res.status(201).json({
          message: 'Found Many Publications',
          publications: publicationsISBN,
          sectionObject: sectionsToSent
        })

      }

      else {
        res.status(404).json({
          message: 'Something went wrong.\n Please double-check the identifier you provided to ensure its accuracy'
        })
      }
    }



    else {
      res.status(404).json({
        message: 'Something went wrong.\n Please double-check the identifier you provided to ensure its accuracy'
      })
    }

    //Έλεγχος του isbn των αποτελεσμάτων με το isbn που έδωσε ο χρήστη για να γίνει η εισαγωγή








    /*


    const publicationsFound = {
      title: response.data.message.items[0].original.replace(/<[^>]*>/g, '') - title[0].replace(/<[^>]*>/g, ''),
      abstract: response.data.message.items[0].abstract,
      link: response.data.message.items[0].resource.primary.URL,
      doi: response.data.message.items[0].DOI ? response.data.message.items[0].ISBN[0] : null,
      isbn: response.data.message.items[0].ISBN[0] ? response.data.message.items[0].ISBN[0] : null,
      section: type2,
      editor: response.data.message.items[0].publisher,
      year: response.data.message.items[0].issued['date-parts'][0][0]
    }*/







  }





}


exports.add_multiple_publications_isbn_based = async (req, res, next) => {


  const pubications = req.body;



  try {
    for (let publication of pubications) {

      let publicationToAdd = {
        title: publication.title,
        abstract: publication.abstract,
        year: publication.year,
        section: publication.type,
        doi: publication.doi,
        isbn: publication.isbn
      }
      let createdPublication = await Publication.create(publicationToAdd)
      // Find the user from the database based on the userData object stored in the request
      const userCreator = await User.findOne({ where: { user_id: req.userData.userId } });



      //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
      const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
      const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

      //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
      createdPublication.addPublicationcategories(allCategoryFound);
      createdPublication.addPublicationcategories(uncategorizedFound);




      //console.log("USER", userCreator)

      // Connect the created publication with the current user
      await createdPublication.setUser(userCreator);

      switch (publicationToAdd.section) {

        case 'Article':
          let articleToAdd = publication.section

          console.log(articleToAdd)
          const article2 = await Article.create(articleToAdd);
          await createdPublication.setArticle(article2)
          break;

        case 'Book':

          let bookToAdd = publication.section
          console.log(bookToAdd)
          const bookToAdd1 = await Book.create(bookToAdd);
          await createdPublication.setBook(bookToAdd1)

          break;

        case 'Book_Chapter':
          let bookChapterToAdd = publication.section
          console.log(publicationToAdd)
          console.log(bookChapterToAdd)

          const bookChapter1 = await ChapterBk.create(bookChapterToAdd);
          await createdPublication.setChapterBk(bookChapter1)
          break;


        case 'Proceedings':
          let proceedingToAdd = publication.section

          console.log(proceedingToAdd)

          //const proceedingToAdd1 = await Proceeding.create(proceedingToAdd);
          //await createdPublication.setProceeding(proceedingToAdd1)
          break;

        case 'Thesis':
          let thesisToAdd = publication.section
          console.log(thesisToAdd)

          const thesisToAdd1 = await Thesis.create(thesisToAdd);
          await createdPublication.setThesis(thesisToAdd1)
          break;

        case 'Tech_Report':

          let techReportToAdd = publication.section
          console.log(techReportToAdd)
          const techReportToAdd1 = await TechReport.create(techReportToAdd);
          await createdPublication.setTechReport(techReportToAdd1)
          break;

        default:
          break;


      }
    }
  } catch (err) {
    console.log(err)

    if (err) {
      res.status(400).json({
        message: "Error while adding publication!"
      })
    }

  }

  res.status(201).json({
    message: "Publications Added successfully!"
  })






}


exports.search_publications_of_author = async (req, res, next) => {




  try {

    let authorsFromSerpApi = [];
    let authorInterests = [];
    let authors = []
    const author = req.body.author;

    console.log(author)

    query = `author.name:${author}`


    //Αρχικά στέλνουμε ένα get request στο axios api για να βρούμε το profile του ερευνητή
    const serpApiProfileResults = await axios.get(`https://serpapi.com/search?engine=google_scholar_profiles&num=5&mauthors=${author}&api_key=${"60ec0fe2a88b7554ba64c60de952913a1019bd4825d0f0973682786921859ee9"}`, {
      maxRedirects: 0
    })



    console.log(serpApiProfileResults)



    //console.log(serpApiProfileResults.data.profiles.length)

    let profiles = serpApiProfileResults.data.profiles;

    if (serpApiProfileResults.data.profiles) {
      for (let profile of profiles) {


        const resultForAuthors = await axios.get(`https://serpapi.com/search?engine=google_scholar_author&author_id=${profile.author_id}&api_key=${"60ec0fe2a88b7554ba64c60de952913a1019bd4825d0f0973682786921859ee9"}&num=3`, {
          maxRedirects: 0
        })



        let papers = []
        if (resultForAuthors.data.articles) {
          //Παίρνουμε τα μεταδεδομένα από κάποιες δημοσιεύσεις του ερευνητή
          resultForAuthors.data.articles.map(a => {
            papers.push({
              title: a.title,
              link: a.link,
              year: a.year

            })
          })
        }


        if (resultForAuthors.data.author) {

          if (resultForAuthors.data.author.interests) {
            resultForAuthors.data.author.interests.map(interest => {
              authorInterests.push(interest.title)
            })
          }


          authors.push({
            author: resultForAuthors.data.author.name,
            author_id: profile.author_id,
            current_job: resultForAuthors.data.author.affiliations,
            interests: authorInterests,
            pubications: papers
          })


        }



      }
      console.log(authors)


      res.status(200).json({
        message: 'Found researchers',
        Authors: authors
      })

    }

    else {
      res.status(400).json({
        message: 'Did not found any researcher'
      })
    }


  } catch (err) {
    console.log("EROR", err)
  }






}


exports.add_publications_based_on_author_id = async (req, res, next) => {


  const author_id = req.body.author_id;
  let paperTitles = [];
  const authorFullName = req.body.author_name;
  let publication;

  console.log("Author", authorFullName)

  const nameParts = authorFullName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts[1];

  const externalAuthorFound = await ExternalAuthor.findOne({ where: { firstName: firstName, lastName: lastName } });

  console.log(externalAuthorFound)

  if (externalAuthorFound) {

    const publications = await Publication.findAll({
      include: [
        {
          model: ExternalAuthor,
          as: 'externalAuthors',
          where: { externalAuthor_id: externalAuthorFound.externalAuthor_id }, // Filter by external author ID
        }
      ],
    });

    for (let publication of publications) {

      if (publication.userId === null) {
        publication.userId = await req.userData.userId;
        await publication.save()
      }

    }


    res.status(200).json({
      message: 'Publication added to your directory'
    })




  }



  const resultForAuthors = await axios.get(`https://serpapi.com/search?engine=google_scholar_author&author_id=${author_id}&api_key=${"60ec0fe2a88b7554ba64c60de952913a1019bd4825d0f0973682786921859ee9"}&num=20`)


  //console.log(resultForAuthors.data.author)
  //console.log(resultForAuthors.data.articles)

  //Παίρνουμε τους τίτλους απο κάθε δημοσίευση του ερευνητή
  if (resultForAuthors.data) {
    resultForAuthors.data.articles.map(a => {
      paperTitles.push(a.title)
    })
  }
  const url = `https://api.crossref.org/works`
  console.log(paperTitles)

  try {

    let crossRefTitles = []
    for (let title of paperTitles) {
      let crossRefResult = await axios.get(url, { params: { query: title, rows: '1', 'query.author': authorFullName } });
      crossRefResult.data.message.items.map(async publicationFound => {



        if (publicationFound.title) {
          //Αρχικά ελέγχουμε αν υπάρχουν συγγραφείς
          let name
          let publicationFoundAuthors = []
          publicationFound.author.map(async a => {
            name = a.given + " " + a.family;
            //console.log(name, " ", publicationFound.title[0])
            publicationFoundAuthors.push(name.toLowerCase().replace(/\s/g, ''))
          })

          //Σετάρισμα του τύπου της δημοσίευσης
          let sectionToSet;
          if (publicationFound.type === 'journal-article') {
            sectionToSet = 'Article'
          }

          else if (publicationFound.type === 'book-chapter') {
            sectionToSet = 'Book_Chapter'
          }

          else if (publicationFound.type === 'book' || publicationFound.type === 'book-series') {
            sectionToSet = 'Book'
          }

          else if (publicationFound.type === 'proceedings-article' || publicationFound.type === 'proceedings' || publicationFound.type === 'proceedings-series') {
            sectionToSet = 'Proceedings'
          }

          else if (publicationFound.type === 'report' || publicationFound.type === 'report-component' || publicationFound.type === 'report-series') {
            sectionToSet = 'Tech_Report'
          }

          else if (publicationFound.type === 'dissertation') {
            sectionToSet = 'Thesis'
          }

          else {
            sectionToSet = 'Other'
          }



          //Σετάρισμα του ISBN αν υπάρχει
          let isbnToSet;
          if (publicationFound.ISBN) {
            if (publicationFound.ISBN.length === 2) {
              isbnToSet = publicationFound.ISBN[1];
              console.log(publicationFound.ISBN[1])
            }
            else if (publicationFound.ISBN.length === 1) {
              isbnToSet = publicationFound.ISBN[0]
            }
          } else {
            isbnToSet = null
          }


          //Σετάρισμα χρονιάς αν υπάρχει
          let yearToSet;
          if (publicationFound.published) {
            yearToSet = publicationFound.published['date-parts'][0][0]
            console.log(publicationFound.published['date-parts'][0][0])
          }

          else {
            yearToSet = null
          }

          //Δημιουργία αντικειμένου publication 
          let abstractToSet;
          if (publicationFound.abstract) {
            abstractToSet = publicationFound.abstract;
          }
          else {
            abstractToSet = null
          }


          publication = {
            title: publicationFound.title ? publicationFound.title[0].replace(/<[^>]*>/g, ' ') : "",
            section: sectionToSet,
            abstract: publicationFound.abstract ? publicationFound.abstract.replace(/\n/g, '').replace(/<[^>]+>/g, '') : "", //Θα γίνει χρήση του scholar για να βρίσκουμε το snippet μέσω του τίτλου και έπειτα θα γίνεται η αναζήτητ του ολοκληρωμένου abstract απο το findFullAbstract μέθδοο
            isbn: isbnToSet,
            doi: publicationFound.DOI,
            year: yearToSet,
            authors: publicationFoundAuthors
          }






          const createdPublication = await Publication.create(publication, { include: [Article, Book, Proceeding, Thesis, ChapterBk, TechReport] });

          // Find the user from the database based on the userData object stored in the request
          const userCreator = await User.findOne({ where: { user_id: req.userData.userId } });
          console.log("IDDDD", 1, req.userData.userId)

          //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
          const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
          const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

          //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
          createdPublication.addPublicationcategories(allCategoryFound);
          createdPublication.addPublicationcategories(uncategorizedFound);

          // Connect the created publication with the current user
          await createdPublication.setUser(userCreator);

          await createdPublication.setInternalAuthors(userCreator);

          //Δημιουργία αντικειμένου για στατιστικά
          const publicationStatsObj = {
            citations: 0,
            references: 0,
            num_of_exported_presentation_file: 0,
            num_of_exported_content_file: 0,
            reqs_of_exported_presentation_file: 0,
            reqs_of_exported_content_file: 0,
          }
          //Αποθήκευση αντικειμένου για στατιστικά στην Βάση
          const publicationStats = await PublicationStats.create(publicationStatsObj);
          //συσχέτιση αντικειμένου publicationStat με την Δημοσίευση που δημιουργήσαμε 
          await createdPublication.setPublicationStat(publicationStats);


          switch (publication.section) {


            case 'Article':

              let jurnalToSet;
              if (publicationFound['short-container-title']) {
                jurnalToSet = publicationFound['short-container-title'][0];
              }
              else if (publicationFound['container-title']) {
                jurnalToSet = publicationFound['container-title'][0];
              }
              else {
                jurnalToSet = ""
              }

              sectionCreated = {
                jurnal: jurnalToSet,
                number: publicationFound.issue ? publicationFound.issue : null,
                volume: publicationFound.volume ? publicationFound.volume : null,
                pages: publicationFound.page ? publicationFound.page : null,
                month: publicationFound.month ? publicationFound.month : 'Not Defined'
              }


              console.log(sectionCreated)


              console.log(sectionCreated)
              console.log(createdPublication)

              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const article1 = await Article.create(sectionCreated)
              await createdPublication.setArticle(article1)

              break;

            case 'Book_Chapter':

              let chapterToSet;

              if (publicationFound['container-title']) {
                chapterToSet = publicationFound['container-title'][0]
              }
              else {
                chapterToSet = ""
              }

              sectionCreated = {
                chapter: chapterToSet,
                publisher: publicationFound.publisher ? publicationFound.publisher : "",
                pages: publicationFound.page ? publicationFound.page : "",
                volume: publicationFound['edition-number'] ? publicationFound['edition-number'] : null,
                series: publicationFound.series ? publicationFound.series : null,
                type: 'Book_Chapter'
              }
              console.log(sectionCreated)


              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const bookCpt1 = await ChapterBk.create(sectionCreated)
              await createdPublication.setChapterBk(bookCpt1)
              break;

            case 'Book':

              let publisherToSet;
              if (publicationFound.publisher) {
                publisherToSet = publicationFound.publisher
              }
              else {
                publisherToSet = ""
              }

              sectionCreated = {
                publisher: publisherToSet,
                number: publicationFound.issue ? publicationFound.issue : null,
                volume: publicationFound.volume ? publicationFound.volume : null,
                pages: publicationFound.page ? publicationFound.pages : null,
                month: publicationFound.month ? publicationFound.month : 'Not Defined',
                series: publicationFound.series ? publicationFound.series : null,
                address: publicationFound.address ? publicationFound.address : null,
                version: publicationFound.version ? publicationFound.version : null,
              }
              console.log(sectionCreated)
              console.log(publicationFound.issued['date-parts']);


              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const book1 = await Book.create(sectionCreated)
              await createdPublication.setBook(book1)
              break;


            case 'Proceedings':


              let monthToSet = 'Not Defined';
              if (publicationFound.published) {
                let monthNumber = publicationFound.published['date-parts'][0][1];

                switch (monthNumber) {

                  case 1:
                    monthToSet = 'January'
                    break;

                  case 2:
                    monthToSet = 'February';
                    break;
                  case 3:
                    monthToSet = 'March';
                    break;
                  case 4:
                    monthToSet = 'April';
                    break;
                  case 5:
                    monthToSet = 'May';
                    break;
                  case 6:
                    monthToSet = 'June';
                    break;
                  case 7:
                    monthToSet = 'July';
                    break;
                  case 8:
                    monthToSet = 'August';
                    break;
                  case 9:
                    monthToSet = 'September';
                    break;
                  case 10:
                    monthToSet = 'October';
                    break;
                  case 11:
                    monthToSet = 'November';
                    break;
                  case 12:
                    monthToSet = 'December';
                    break;

                }
              }


              let editorToSet;
              if (publicationFound.publisher) {
                editorToSet = publicationFound.publisher
              }
              else {
                editorToSet = ""
              }

              sectionCreated = {
                editor: editorToSet,
                number: publicationFound.issue ? publicationFound.issue : null,
                volume: publicationFound.volume ? publicationFound.volume : null,
                pages: publicationFound.pages ? publicationFound.pages : null,
                month: monthToSet,
                organization: publicationFound.message ? publicationFound.publisher : null,
                address: publicationFound.event ? publicationFound.event.location : null,
                publisher: publicationFound.message ? publicationFound.publisher : null,
              }


              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const proceeding1 = await Proceeding.create(sectionCreated)
              await createdPublication.setProceeding(proceeding1)
              break;


            case 'Tech_Report':

              let institutionToSet;
              console.log(publicationFound)
              if (publicationFound.institution && publicationFound.institution.length > 0) {
                institutionToSet = publicationFound.institution[0]['name']
              }
              else {
                institutionToSet = ""
              }

              let monthToSett = "Not Defined";
              if (publicationFound.published) {
                let monthNumber = publicationFound.published['date-parts'][0][1];

                switch (monthNumber) {

                  case 1:
                    monthToSett = 'January'
                    break;

                  case 2:
                    monthToSett = 'February';
                    break;
                  case 3:
                    monthToSett = 'March';
                    break;
                  case 4:
                    monthToSett = 'April';
                    break;
                  case 5:
                    monthToSett = 'May';
                    break;
                  case 6:
                    monthToSett = 'June';
                    break;
                  case 7:
                    monthToSett = 'July';
                    break;
                  case 8:
                    monthToSett = 'August';
                    break;
                  case 9:
                    monthToSett = 'September';
                    break;
                  case 10:
                    monthToSett = 'October';
                    break;
                  case 11:
                    monthToSett = 'November';
                    break;
                  case 12:
                    monthToSett = 'December';
                    break;

                }
              }


              sectionCreated = {
                institution: institutionToSet,
                address: publicationFound['publisher-location'] ? publicationFound['publisher-location'] : null,
                month: monthToSett,
                tech_report_year: publication.year,
                type: publicationFound.type,
              }


              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const techReport1 = await TechReport.create(sectionCreated)
              await createdPublication.setTechReport(techReport1)

              console.log(sectionCreated)
              break;


            case 'Thesis':

              let schoolToSet;
              if (publicationFound.institution) {
                schoolToSet = publicationFound.institution[0]['name']
              }
              else {
                schoolToSet = ""
              }

              let degreeToSet = 'Other';
              if (publicationFound.degree) {
                if (publicationFound.degree[0].toLowerCase().includes('master')) {
                  degreeToSet = 'Master'
                }
                else if (publicationFound.degree[0].toLowerCase().includes('phd')) {
                  degreeToSet = 'PhD'
                }
                else {
                  degreeToSet = 'Other';
                }
              }



              let monthToSet2 = 'Not Defined';
              if (publicationFound.data.message.deposited) {
                let monthNumber = publicationFound.deposited['date-parts'][0][1];

                switch (monthNumber) {

                  case 1:
                    monthToSet2 = 'January'
                    break;

                  case 2:
                    monthToSet2 = 'February';
                    break;
                  case 3:
                    monthToSet2 = 'March';
                    break;
                  case 4:
                    monthToSet2 = 'April';
                    break;
                  case 5:
                    monthToSet2 = 'May';
                    break;
                  case 6:
                    monthToSet2 = 'June';
                    break;
                  case 7:
                    monthToSet2 = 'July';
                    break;
                  case 8:
                    monthToSet2 = 'August';
                    break;
                  case 9:
                    monthToSet2 = 'September';
                    break;
                  case 10:
                    monthToSet2 = 'October';
                    break;
                  case 11:
                    monthToSet2 = 'November';
                    break;
                  case 12:
                    monthToSet2 = 'December';
                    break;

                }
              }
              sectionCreated = {
                school: schoolToSet,
                type: degreeToSet,
                month: monthToSet2,
                address: publicationFound.publisher ? publicationFound.publisher : null,

              }


              //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
              const thesis1 = await Thesis.create(sectionCreated)
              await createdPublication.setThesis(thesis1)

              console.log(sectionCreated);
              break;


            default:

              sectionCreated = {
                publisher: publicationFound.publisher ? publicationFound.publisher : null,
                type: publicationFound.type
              }
              console.log(sectionCreated)
              break;
          }
          console.log("FOUND")







        }


      })
    }




  } catch (err) {
    console.log(err)
  }

  res.status(200).json({
    message: 'Publications added successfully!'
  })








}


exports.delet_many_publications = async (req, res, next) => {


  const publicationIds = req.body.publicationIds;


  for (let id of publicationIds) {
    const publicationFound = await Publication.findByPk(id);


    //παίρνουμε τις εσωτερικές αναφορές
    if (publicationFound) {


      //Σε περίπτωση που διαγραφή αυτό που αναφέρεται
      const internalRefs = await publicationFound.getReferences();
      //τοποθετούμε σε έναν πίνακα τα ids των δημοσιεύσεων
      let pubIds = []
      for (let ref of internalRefs) {
        pubIds.push(ref.publication_id)
      }

      //Διατρέχουμε τον πίνακα με τα ids  και βρίσκουμε τις δημοσιεύσεις με βάση αυτά τα ids
      for (let id of pubIds) {
        const publicationFound = await Publication.findByPk(id);

        //Αν βρεθεί δημοσίευση τότε παίρνουμε τα στατιστικά της και μειώνουμε κατα ένα το citations αυτής 
        if (publicationFound) {
          const publicationStat = await publicationFound.getPublicationStat();
          await publicationStat.decrement('citations', { by: 1 });
        }
      }


      //Σε περίπτωση που διαγραφή αυτό που αναφέρει
      //Παίρνουμε τις αναφορές
      const references = await InternalReference.findAll({ where: { referencePublicationId: publicationFound.publication_id } });
      //τοποθετούμε σε έναν πίνακα τα ids των δημοσιεύσεων
      let pubIds2 = []
      for (let ref of references) {
        pubIds2.push(ref.publicationPublicationId)
      }
      //Βρίσκουμε την κάθε δημοσίευση με βάση το id και αλλάζουμε το περιεχόμενο του πίνακα PublicationStat 
      for (let id of pubIds2) {
        const publicationFound = await Publication.findByPk(id);
        if (publicationFound) {
          const publicationStat = await publicationFound.getPublicationStat();
          await publicationStat.decrement('references', { by: 1 });
        }
      }





    }



  }


  try {
    const result = await Publication.destroy({ where: { publication_id: publicationIds, userId: req.userData.userId } });


    if (result > 0) {
      res.status(200).json({
        message: 'Publications deleted successfully!'
      })
    }

    else {
      res.status(200).json({
        message: 'No Publications deleted!'
      })
    }

    console.log(result)
  } catch (err) {
    console.log(err)
  }





}


exports.add_publication_to_category = async (req, res, next) => {


  const publicationId = req.body.publicationId;
  const categoryId = req.body.categoryId;


  console.log(publicationId)
  console.log(categoryId)


  try {
    const publication = await Publication.findByPk(publicationId);
    const category = await Category.findByPk(categoryId);

    //Αν βρεθούν η δημοσίευση και η κατηγορία
    if (publication && category) {
      //Αρχικά παίρνουμε την Uncategorized κατηγορία του χρήστη
      const uncategorizedFound = await Category.findOne({ where: { userId: req.userData.userId, state: 'Uncategorized' } })
      //Αν υπάρχει ελέγχουμε αν η παρούσα δημοσίευση που θέλουμε να προσθέσουμε σε κατηγορία υπάρχει στην συγκεκριμένη λίστα
      if (uncategorizedFound) {
        //Έπειτα ελέγχουμε αν η Uncategorized  κατηγορία έχει μέσα της την δημοσίευση που κάνουμε τώρα αλλαγή
        const publicationExistsInUncategorized = await uncategorizedFound.hasPublicationcategory(publication);
        console.log(publicationExistsInUncategorized)
        //αν ναι τότε προχωράμε στην αφαίρεση της απο την Uncategorized έτσι
        if (publicationExistsInUncategorized) {
          const removedResult = await uncategorizedFound.removePublicationcategory(publication);
        }

      }



      //Ελέγχουμε αν η κατηγορία στην οποία θα μεταφερθεί η δημοσίευση είναι η Uncategorized, αν ναι τότε την αφαιρούμε απο όλες τις υπόλοιπες
      if (category.state === 'Uncategorized') {
        const categories = await publication.getPublicationcategories();
        for (let category of categories) {
          if (category.state !== 'All')
            await category.removePublicationcategory(publication)
        }
      }


      //Εν συνεχεία γίνεται η προσθήκη στην αντίστοιχη κατηγορία που επέλεξε ο χρήστης
      const result = await publication.addPublicationcategories(category);

      console.log(result)

      //Αν το αποτέλεσμα υπάρχει τότε σημαίνει πως έγινε προσθήκη
      if (result) {
        res.status(200).json({
          message: 'Publication moved successfully to the category'
        })
      }
      //Διαφορετικά σημαίνει ότι δεν έγινε προσθήκη σε καινούργια κατηγορία οπότε στέλνουμε μήνυμα στον χρήστη
      else {
        res.status(200).json({
          message: 'Nothing changed'
        })
      }

    }

    //Αν δεν βρεθεί η δημοσίευση και η κατηγορία
    else {
      res.status(200).json({
        message: "Please check the identifiers"
      })
    }


  } catch (err) {
    console.log(err)
  }

}


exports.add_many_publications_to_category = async (req, res, next) => {


  const publicationsId = req.body.publicationsId;
  const categoryId = req.body.categoryId;


  console.log(publicationsId)

  let categoryFound = await Category.findByPk(categoryId);

  if (categoryFound) {
    let result;
    for (let pubication_id of publicationsId) {

      let publicationFound = await Publication.findByPk(pubication_id);

      if (publicationFound) {


        const uncategorizedFound = await Category.findOne({ where: { userId: req.userData.userId, state: 'Uncategorized' } })

        //Αν υπάρχει ελέγχουμε αν η παρούσα δημοσίευση που θέλουμε να προσθέσουμε σε κατηγορία υπάρχει στην συγκεκριμένη λίστα
        if (uncategorizedFound) {
          //Έπειτα ελέγχουμε αν η Uncategorized  κατηγορία έχει μέσα της την δημοσίευση που κάνουμε τώρα αλλαγή
          const publicationExistsInUncategorized = await uncategorizedFound.hasPublicationcategory(publicationFound);
          console.log(publicationExistsInUncategorized)
          //αν ναι τότε προχωράμε στην αφαίρεση της απο την Uncategorized έτσι
          if (publicationExistsInUncategorized) {
            const removedResult = await uncategorizedFound.removePublicationcategory(publicationFound);
          }

        }


        //Ελέγχουμε αν η κατηγορία στην οποία θα μεταφερθεί η δημοσίευση είναι η Uncategorized, αν ναι τότε την αφαιρούμε απο όλες τις υπόλοιπες
        if (categoryFound.state === 'Uncategorized') {
          const categories = await publicationFound.getPublicationcategories();
          for (let category of categories) {
            if (category.state !== 'All')
              await category.removePublicationcategory(publicationFound)
          }
        }


        result = await publicationFound.addPublicationcategories(categoryFound);
        console.log(result)



      }




    }


    if (result) {
      res.status(200).json({
        message: 'Publications added to category!'
      })
    }

    else {
      res.status(200).json({
        message: 'Nothing changed'
      })
    }

  }

  else {
    res.status(400).json({
      message: 'Could not found category'
    })
  }






}


exports.change_publication_to_another_category = async (req, res, next) => {

  const publicationId = req.body.publicationId;
  const categeryFromId = req.body.categeryFromId;
  const categeryToId = req.body.categeryToId;

  console.log("Publication id :", publicationId)
  console.log("categeryFromId :", categeryFromId)

  console.log("categeryToId :", categeryToId)





  const foundPublication = await Publication.findOne({ where: { publication_id: publicationId, userId: req.userData.userId } })

  const categeryFromFound = await Category.findOne({ where: { category_id: categeryFromId, userId: req.userData.userId, state: { [Sequelize.Op.or]: ['Manual', 'Uncategorized'] } } })

  const categeryToFound = await Category.findOne({ where: { category_id: categeryToId, userId: req.userData.userId, state: { [Sequelize.Op.or]: ['Manual', 'Uncategorized'] } } })


  console.log(categeryToFound)
  console.log(categeryFromFound)
  console.log(foundPublication)



  if (foundPublication && categeryFromFound && categeryToFound) {


    const removedResult = await categeryFromFound.removePublicationcategory(foundPublication);

    const movedResult = await categeryToFound.addPublicationcategories(foundPublication)



    res.status(200).json({
      message: 'Publication moved successfully!'
    })



  }

  else {
    res.status(400).json({
      message: 'Did not found any publication with that id'
    })
  }






}


exports.remove_publication_from_category = async (req, res, next) => {


  const publicationId = req.body.publicationId;
  const categeryFromId = req.body.categeryFromId;


  try {


    const foundPublication = await Publication.findOne({ where: { publication_id: publicationId, userId: req.userData.userId } });

    const categeryFromFound = await Category.findOne({ where: { category_id: categeryFromId, userId: req.userData.userId, state: 'Manual' } });

    const uncategorizedFound = await Category.findOne({ where: { userId: req.userData.userId, state: 'Uncategorized' } })


    if (foundPublication && categeryFromFound) {
      const removedResult = await categeryFromFound.removePublicationcategory(foundPublication);
      const movedResult = await foundPublication.addPublicationcategories(uncategorizedFound);

      console.log(removedResult)
      console.log(movedResult)

      if (removedResult && movedResult) {
        res.status(200).json({
          message: 'Publication removed successfully!'
        })
      }


      else {
        res.status(200).json({
          message: 'Nothing changed!'
        })
      }

    }

  } catch (err) {

    console.log(err)
  }








}


exports.add_description_file = async (req, res, next) => {


  const userId = req.userData.userId;
  const folderPath = './uploads/' + userId;

  console.log(req.file)

  if (req.file) {
    const fileName = req.file.originalname;
    const filePath = folderPath + '/' + fileName;
    try {
      // Move the uploaded file to the specified folder
      fs.renameSync(req.file.path, filePath);

      // Create a record in the database for the uploaded file
      const fileRecord = await File.create({
        filename: fileName,
        path: filePath,
      });


      //Σε περίπτωση που το αρχείο είναι με κατάληξη .bib 
      if (req.file.originalname.includes('.bib')) {

        //Διαβάζουμε το αρχείο 
        fs.readFile(filePath, 'utf-8', (err, data) => {

          if (err) {
            return;
          }

          //console.log(data)
          const publications = data.split('@');


          publications.map(async p => {
            const matchTitle = p.match(/title = {([^}]*)}/);
            const matchAbstract = p.match(/abstract = {([^}]*)}/);
            const matchType = p.match(/(\w+)\{/);
            const matchDOI = p.match(/doi = {([^}]*)}/);
            const matchISBN = p.match(/isbn = {([^}]*)}/);
            const matchYear = p.match(/year = {([^}]*)}/);
            const matchNote = p.match(/note = {([^}]*)}/);


            if (matchTitle) {



              let type;
              if (matchType && matchType.length > 1) {
                type = matchType[1];
                console.log('Type:', type);
              }




              let sectionObject;

              let sectionToSet;
              let journalToSet;
              let volumeToSet;
              let numberToSet;
              let pagesToSet;
              let monthToSet;
              let thesisType;

              switch (type) {
                case 'article':
                  sectionToSet = 'Article';
                  break;

                case 'book':
                  sectionToSet = 'Book';
                  break;

                case 'inbook':
                  sectionToSet = 'Book_Chapter';

                  break;

                case 'inproceedings':
                  sectionToSet = 'Proceedings';

                  break;

                case 'proceedings':
                  sectionToSet = 'Proceedings';

                  break;

                case 'masterthesis':
                  sectionToSet = 'Thesis';
                  thesisType = 'Master';

                  break;

                case 'phdthesis':
                  sectionToSet = 'Thesis';
                  thesisType = 'PhD';

                  break;

                case 'techreport':
                  sectionToSet = 'Tech_Report';

                  break;

                default:
                  sectionToSet = 'Other';

                  break
              }

              let titleToset;
              if (matchTitle && matchTitle.length > 1) {
                titleToset = matchTitle[1];
              }

              let abstractToSet;
              if (matchAbstract && matchAbstract.length > 1) {
                abstractToSet = matchAbstract[1];
              }

              let doiToSet;
              if (matchDOI && matchDOI.length > 1) {
                doiToSet = matchDOI[1];
              }

              let isbnToSet;
              if (matchISBN && matchISBN.length > 1) {
                isbnToSet = matchISBN[1].replace(/-/g, '');
              }

              let yearToSet;
              if (matchYear && matchYear.length > 1) {
                yearToSet = matchYear[1];
              }

              let noteToSet;
              if (matchNote && matchNote.length > 1) {
                noteToSet = matchNote[1];
              }

              let typeToSet;
              if (matchType && matchType.length > 1) {
                typeToSet = matchType[1];
              }


              const publicationObj = {
                title: titleToset,
                section: sectionToSet,
                abstract: abstractToSet,
                year: yearToSet,
                isbn: isbnToSet,
                doi: doiToSet,
                note: noteToSet

              }
              console.log(publicationObj);



              //Αποθήκευση της Δημοσίευσης στην βάση, εύρεση του χρήστη και συσχέτιση του χρήστη με την Δημοσίευση
              const createdPublication = await Publication.create(publicationObj, { include: Article, Book, Proceeding, Thesis, ChapterBk, TechReport, Other })
              const userCreator = await User.findOne({ where: { user_id: req.userData.userId } });
              await createdPublication.setUser(userCreator);


              //Έπειτα γίνεται η αποθήκευση των δημοσιεύσεων στις default κατηγορίες
              //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
              const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
              const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

              //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
              createdPublication.addPublicationcategories(allCategoryFound);
              createdPublication.addPublicationcategories(uncategorizedFound);


              //Έπειτα ανάλογα με το είδος της εκάστοτε δημοσίευσης γίνεται η δημιουργία των αντικειμένων αυτών και η συσχέτιση με την Δημοσίευση
              switch (publicationObj.section) {


                case 'Article':
                  const matchJournal = data.match(/journal\s*=\s*{([^}]*)}/);
                  const matchVolume = data.match(/volume\s*=\s*{([^}]*)}/);
                  const matchNumber = data.match(/number\s*=\s*{([^}]*)}/);
                  const matchPages = data.match(/pages\s*=\s*{([^}]*)}/);
                  const matchMonth = data.match(/month\s*=\s*{([^}]*)}/);
                  journalToSet = matchJournal ? matchJournal[1] : '';
                  volumeToSet = matchVolume ? matchVolume[1] : '';
                  numberToSet = matchNumber ? matchNumber[1] : '';
                  pagesToSet = matchPages ? matchPages[1] : '';
                  monthToSet = matchMonth ? matchMonth[1] : '';
                  const article = {
                    jurnal: journalToSet,
                    volume: volumeToSet,
                    pages: pagesToSet,
                    month: monthToSet,

                  }

                  if (journalToSet) {
                    const article1 = await Article.create(article);
                    await createdPublication.setArticle(article1)
                    console.log(sectionObject)
                  }

                  break;


                case 'Book':

                  const matchPublisher = data.match(/publisher\s*=\s*{([^}]*)}/);
                  const matchVolumeBook = data.match(/volume\s*=\s*{([^}]*)}/);
                  const matchSeries = data.match(/series\s*=\s*{([^}]*)}/);
                  const matchPagesBook = data.match(/pages\s*=\s*{([^}]*)}/);
                  const matchAddress = data.match(/address\s*=\s*{([^}]*)}/);
                  const matchMonthBook = data.match(/month\s*=\s*{([^}]*)}/);
                  const matchEdition = data.match(/edition\s*=\s*{([^}]*)}/);


                  const publisher = matchPublisher ? matchPublisher[1] : '';
                  const volume = matchVolumeBook ? matchVolumeBook[1] : '';
                  const series = matchSeries ? matchSeries[1] : '';
                  const pages = matchPagesBook ? matchPagesBook[1] : '';
                  const address = matchAddress ? matchAddress[1] : '';
                  const month = matchMonthBook ? matchMonthBook[1] : '';
                  const edition = matchEdition ? matchEdition[1] : '';

                  const book = {
                    publisher: publisher,
                    volume: volume,
                    series: series,
                    pages: pages,
                    address: address,
                    month: month,
                    version: edition,

                  }

                  if (publisher) {
                    const book1 = await Book.create(book);
                    await createdPublication.setBook(book1)
                    console.log(sectionObject)
                  }



                  break;



                case 'Book_Chapter':

                  const matchChapter = data.match(/chapter\s*=\s*{([^}]*)}/);
                  const matchPagesBc = data.match(/pages\s*=\s*{([^}]*)}/);
                  const matchPublisherBc = data.match(/publisher\s*=\s*{([^}]*)}/);
                  const matchVolumeBc = data.match(/volume\s*=\s*{([^}]*)}/);
                  const matchSeriesBc = data.match(/series\s*=\s*{([^}]*)}/);
                  const matchType = data.match(/type\s*=\s*{([^}]*)}/);
                  const matchAddressBc = data.match(/address\s*=\s*{([^}]*)}/);
                  const matchMonthBc = data.match(/month\s*=\s*{([^}]*)}/);
                  const matchEditionBc = data.match(/edition\s*=\s*{([^}]*)}/);


                  const chapterBc = matchChapter ? matchChapter[1] : '';
                  const pagesBc = matchPagesBc ? matchPagesBc[1] : '';
                  const publisherBc = matchPublisherBc ? matchPublisherBc[1] : '';
                  const volumeBc = matchVolumeBc ? matchVolumeBc[1] : '';
                  const seriesBc = matchSeriesBc ? matchSeriesBc[1] : '';
                  const typeBc = matchType ? matchType[1] : '';
                  const addressBc = matchAddressBc ? matchAddressBc[1] : '';
                  const monthBc = matchMonthBc ? matchMonthBc[1] : '';
                  const editionBc = matchEditionBc ? matchEditionBc[1] : '';



                  const book_chapter = {
                    chapter: chapterBc,
                    publisher: publisherBc,
                    pages: pagesBc,
                    volume: volumeBc,
                    series: seriesBc,
                    type: typeBc,
                    month: monthBc,
                    address: addressBc,
                    editionBc: editionBc
                  }

                  if (chapterBc) {
                    const book_chapter1 = await ChapterBk.create(book_chapter);
                    await createdPublication.setChapterBk(book_chapter1)
                    console.log(sectionObject)
                  }



                  break;



                case 'Proceedings':

                  const matchPublisherPr = data.match(/publisher\s*=\s*{([^}]*)}/);
                  const matchPagesPr = data.match(/pages\s*=\s*{([^}]*)}/);
                  const matchEditorPr = data.match(/editor\s*=\s*{([^}]*)}/);
                  const matchSeriesPr = data.match(/series\s*=\s*{([^}]*)}/);
                  const matchAddressPr = data.match(/address\s*=\s*{([^}]*)}/);
                  const matchMonthPr = data.match(/month\s*=\s*{([^}]*)}/);
                  const matchOrganizationPr = data.match(/organization\s*=\s*{([^}]*)}/);


                  const publisherPr = matchPublisherPr ? matchPublisherPr[1] : '';
                  const pagesPr = matchPagesPr ? matchPagesPr[1] : '';
                  const editorPr = matchEditorPr ? matchEditorPr[1] : '';
                  const seriesPr = matchSeriesPr ? matchSeriesPr[1] : '';
                  const addressPr = matchAddressPr ? matchAddressPr[1] : '';
                  const monthPr = matchMonthPr ? matchMonthPr[1] : '';
                  const organization = matchOrganizationPr ? matchOrganizationPr[1] : '';


                  const proceeding = {
                    editor: editorPr,
                    series: seriesPr,
                    pages: pagesPr,
                    month: monthPr,
                    organization: organization,
                    address: addressPr,
                    publisher: publisherPr,

                  }

                  if (editorPr) {
                    const proceeding1 = await Proceeding.create(proceeding)
                    await createdPublication.setProceeding(proceeding1)
                  }



                  break;





                case 'Thesis':


                  const matchSchoolTh = data.match(/school\s*=\s*{([^}]*)}/);
                  const matchAddressTh = data.match(/address\s*=\s*{([^}]*)}/);
                  const matchMonthTh = data.match(/month\s*=\s*{([^}]*)}/);

                  // Get the extracted values
                  const schoolTh = matchSchoolTh ? matchSchoolTh[1] : '';
                  const addressTh = matchAddressTh ? matchAddressTh[1] : '';
                  const monthTh = matchMonthTh ? matchMonthTh[1] : '';

                  const thesis = {
                    school: schoolTh,
                    type: thesisType,
                    month: monthTh,
                    address: addressTh
                  }

                  if (schoolTh) {
                    const thesis1 = await Thesis.create(thesis)
                    await createdPublication.setThesis(thesis1)
                  }


                  break;





                case 'Tech_Report':

                  const matchInstitution = data.match(/institution\s*=\s*{([^}]*)}/);
                  const matchTypeTR = data.match(/type\s*=\s*{([^}]*)}/);
                  const matchNumberTR = data.match(/number\s*=\s*{([^}]*)}/);
                  const matchAddressTR = data.match(/address\s*=\s*{([^}]*)}/);
                  const matchMonthTR = data.match(/month\s*=\s*{([^}]*)}/);

                  const institutionTR = matchInstitution ? matchInstitution[1] : '';
                  const typeTR = matchTypeTR ? matchTypeTR[1] : '';
                  const numberTR = matchNumberTR ? matchNumberTR[1] : '';
                  const addressTR = matchAddressTR ? matchAddressTR[1] : '';
                  const monthTR = matchMonthTR ? matchMonthTR[1] : '';

                  const techReport = {
                    address: addressTR,
                    month: monthTR,
                    number: numberTR,
                    type: typeTR,
                    tech_report_year: publicationObj.year,
                    institution: institutionTR

                  }

                  if (institutionTR) {
                    const techReport1 = await TechReport.create(techReport);
                    await createdPublication.setTechReport(techReport1);
                  }


                  break;

                case 'Other':

                  const matchNumberOTH = data.match(/number\s*=\s*{([^}]*)}/);
                  const matchMonthOTH = data.match(/month\s*=\s*{([^}]*)}/);
                  const matchPagesOTH = data.match(/pages\s*=\s*{([^}]*)}/);

                  const matchNumberO = matchNumberOTH ? matchNumberOTH[1] : '';
                  const matchMonthOT = matchMonthOTH ? matchMonthOTH[1] : '';
                  const matchPagesO = matchPagesOTH ? matchPagesOTH[1] : '';


                  const other = {
                    subType: publicationObj.section,
                    grantNumber: matchNumberO,
                    month: matchMonthOT,
                    pages: matchPagesO,

                  }
                  if (publicationObj.section) {
                    const other1 = await Other.create(other);
                    await createdPublication.setOther(other1);
                  }


                  break;


              }


              /*
              Παρακάτω παίρνουμε τα keywords αν υπάρχουν και εν συνεχεία ελέγχουμε αν υπάρχουν στο σύστημα. Αν ναι απλώς
              κάνουμε την συσχέτιση αν όχι δημιουργούμε το κάθε tag με βάση το keyword και στη συνέχεια κάνουμε την συσχέτιση με την δημοσίευση
              */
              const matchKeywords = data.match(/keywords\s*=\s*{([^}]*)}/);
              const tags = matchKeywords ? matchKeywords[1].split(',').map(keyword => keyword.trim()) : [];

              //Διατρέχουμε τον πίνακα των ταγκς που δημιουργήθηκε πιο πάνω
              for (let i = 0; i < tags.length; i++) {

                console.log("Searching for : ", tags[i])

                Tag.findAll({
                  where: {
                    keyword: tags[i]
                  }
                }).then(tag => {

                  if (tag.length >= 1) {
                    createdPublication.addTag(tag)
                    console.log("Found: ", tags[i])
                  }

                  else {
                    Tag.create({

                      keyword: tags[i]
                    }).then(createdTag => {

                      console.log("Create: ", tags[i])
                      createdPublication.addTag(createdTag);

                    })
                  }

                })

              }


            }




          })


        })
      }


      else if (req.file.originalname.includes('.rdf')) {

        console.log("RDF")

        fs.readFile(filePath, 'utf-8', (err, data) => {

          if (err) {
            return;
          }


          //Μετατροπή XML -> JSON
          xml2js.parseString(data, async (parseErr, result) => {
            if (parseErr) {
              console.error(parseErr);
              return;
            }


            const rdf = result['rdf:RDF'];

            const articles = rdf['bib:Article'];
            if (articles) {
              articles.forEach(async article => {
                const itemType = 'Article';
                const volume = article['dcterms:isPartOf'][0]['bib:Journal'][0]['prism:volume'] ? article['dcterms:isPartOf'][0]['bib:Journal'][0]['prism:volume'][0] : null;
                const doi = article['dcterms:isPartOf'][0]['bib:Journal'][0]['dc:identifier'] ? article['dcterms:isPartOf'][0]['bib:Journal'][0]['dc:identifier'][0] : null;
                const doiValue = doi.replace(/^DOI\s+/i, '');
                const number = article['dcterms:isPartOf'][0]['bib:Journal'][0]['prism:number'] ? article['dcterms:isPartOf'][0]['bib:Journal'][0]['prism:number'][0] : null;
                const journal = article['dcterms:isPartOf'][0]['bib:Journal'][0]['dcterms:alternative'] ? article['dcterms:isPartOf'][0]['bib:Journal'][0]['dcterms:alternative'][0] : "";
                const authors = article['bib:authors'][0]['rdf:Seq'][0]['rdf:li'][0]['foaf:Person'][0]['foaf:surname'] ? article['bib:authors'][0]['rdf:Seq'][0]['rdf:li'][0]['foaf:Person'][0]['foaf:surname'][0] : null;
                const title = article['dc:title'] ? article['dc:title'][0] : "";
                const abstract = article['dcterms:abstract'] ? article['dcterms:abstract'][0] : null;
                const pages = article['bib:pages'] ? article['bib:pages'][0] : null;
                const date = article['dc:date'] ? article['dc:date'][0] : null;

                const publication = {
                  title: title,
                  section: itemType,
                  abstract: abstract,
                  doi: doiValue,
                  year: date.split("/")[2],
                }

                const monthNumber = date.split("/")[1]


                let monthToSet;
                switch (monthNumber) {

                  case 1:
                    monthToSet = 'January'
                    break;

                  case 2:
                    monthToSet = 'February';
                    break;
                  case 3:
                    monthToSet = 'March';
                    break;
                  case 4:
                    monthToSet = 'April';
                    break;
                  case 5:
                    monthToSet = 'May';
                    break;
                  case 6:
                    monthToSet = 'June';
                    break;
                  case 7:
                    monthToSet = 'July';
                    break;
                  case 8:
                    monthToSet = 'August';
                    break;
                  case 9:
                    monthToSet = 'September';
                    break;
                  case 10:
                    monthToSet = 'October';
                    break;
                  case 11:
                    monthToSet = 'November';
                    break;
                  case 12:
                    monthToSet = 'December';
                    break;

                }


                const articleToAdd = {
                  jurnal: journal,
                  number: number,
                  volume: volume,
                  pages: pages,
                  month: monthToSet
                }

                console.log(publication)


                if (publication.title) {
                  //Δημιουργία αντικειμένου publication
                  const createdPublication = await Publication.create(publication);

                  //Βρίσκουμε τον χρήστη από την βάση.
                  const userCreator = await User.findOne({ where: { user_id: req.userData.userId } })

                  //αφού βρούμε τον χρήστη έπειτα συνδέουμε την συγκεκριμένη δημοσίευση
                  await createdPublication.setUser(userCreator)

                  //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
                  const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
                  const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

                  //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
                  createdPublication.addPublicationcategories(allCategoryFound);
                  createdPublication.addPublicationcategories(uncategorizedFound);

                  const article1 = await Article.create(articleToAdd);
                  await createdPublication.setArticle(article1)
                }


              });
            }


            const books = rdf['bib:Book'];
            if (books) {

              books.forEach(async book => {

                const series = book['dcterms:isPartOf'][0]['bib:Series'][0]['dc:title'][0];
                const title = book['dc:title'] ? book['dc:title'][0] : " ";
                const abstract = book['dcterms:abstract'] ? book['dcterms:abstract'][0] : "";
                const volume = book['prism:volume'] ? book['prism:volume'][0] : "";
                const isbn = book['dc:identifier'] ? book['dc:identifier'][0].replace(/^ISBN\s+/i, '') : "";
                const date = book['dc:date'] ? book['dc:date'][0] : "";
                const publisher = book['prism:edition'] ? book['prism:edition'][0] : "";
                const pages = book['z:numPages'] ? book['z:numPages'][0] : "";

                const publication = {
                  title: title,
                  section: 'Book',
                  abstract: abstract,
                  isbn: isbn,
                  year: date ? date.split("/")[2] : null,
                }


                const bookToAdd = {
                  publisher: publisher,
                  volume: volume,
                  series: series,
                  pages: pages
                }


                if (publication.title) {
                  //Δημιουργία αντικειμένου publication
                  const createdPublication = await Publication.create(publication);

                  //Βρίσκουμε τον χρήστη από την βάση.
                  const userCreator = await User.findOne({ where: { user_id: req.userData.userId } })

                  //αφού βρούμε τον χρήστη έπειτα συνδέουμε την συγκεκριμένη δημοσίευση
                  await createdPublication.setUser(userCreator)

                  //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
                  const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
                  const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

                  //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
                  createdPublication.addPublicationcategories(allCategoryFound);
                  createdPublication.addPublicationcategories(uncategorizedFound);

                  const book1 = await Book.create(bookToAdd);
                  await createdPublication.setBook(book1)

                  console.log(publication)
                }




              })




            }

            const bookChapters = rdf['bib:BookSection'];
            if (bookChapters) {

              bookChapters.forEach(async bookChapter => {

                console.log(bookChapter)
                const bookTitle = bookChapter['dcterms:isPartOf'][0]['bib:Book'][0]['dc:title'] ? bookChapter['dcterms:isPartOf'][0]['bib:Book'][0]['dc:title'][0] : "";
                const bookSeriesTitle = bookChapter['dcterms:isPartOf'][0]['bib:Book'][0]['dcterms:isPartOf'][0]['bib:Series'][0]['dc:title'] ? bookChapter['dcterms:isPartOf'][0]['bib:Book'][0]['dcterms:isPartOf'][0]['bib:Series'][0]['dc:title'][0] : "";
                const bookChapterTitle = bookChapter['dc:title'] ? bookChapter['dc:title'][0] : "";
                const abstract = bookChapter['dcterms:abstract'] ? bookChapter['dcterms:abstract'][0] : "";
                const date = bookChapter['dc:date'] ? bookChapter['dc:date'][0] : "";
                const pages = bookChapter['bib:pages'] ? bookChapter['bib:pages'][0] : "";
                const edition = bookChapter['prism:edition'] ? bookChapter['prism:edition'][0] : "";


                const publication = {
                  title: bookTitle,
                  section: 'Book_Chapter',
                  abstract: abstract,
                  year: date ? date.split("/")[2] : null,
                }

                const bookChapterToAdd = {
                  chapter: bookChapterTitle,
                  publisher: bookSeriesTitle,
                  series: bookSeriesTitle,
                  pages: pages,
                  volume: edition
                }


                if (publication.title) {
                  //Δημιουργία αντικειμένου publication
                  const createdPublication = await Publication.create(publication);

                  //Βρίσκουμε τον χρήστη από την βάση.
                  const userCreator = await User.findOne({ where: { user_id: req.userData.userId } })

                  //αφού βρούμε τον χρήστη έπειτα συνδέουμε την συγκεκριμένη δημοσίευση
                  await createdPublication.setUser(userCreator)

                  //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
                  const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
                  const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

                  //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
                  createdPublication.addPublicationcategories(allCategoryFound);
                  createdPublication.addPublicationcategories(uncategorizedFound);

                  const chapterBk1 = await ChapterBk.create(bookChapterToAdd);
                  await createdPublication.setChapterBk(chapterBk1)
                }





              })
            }

            const thesisS = rdf['bib:Thesis'];
            if (thesisS) {

              thesisS.forEach(async thesis => {


                const title = thesis['dc:title'][0];
                const abstract = thesis['dcterms:abstract'] ? thesis['dcterms:abstract'][0] : '';
                const school = thesis['dc:publisher'][0]['foaf:Organization'][0]['foaf:name'] ? thesis['dc:publisher'][0]['foaf:Organization'][0]['foaf:name'][0] : "";
                const type = thesis['z:type'] ? thesis['z:type'][0] : "";
                const date = thesis['dc:date'] ? thesis['dc:date'][0] : "";

                const publication = {
                  title: title,
                  section: 'Thesis',
                  abstract: abstract,
                  year: date ? date.split("/")[2] : null,
                }

                let typeToSet;
                if (type.toLowerCase().includes('Master'.toLowerCase())) {
                  typeToSet = 'Master';
                }
                else if (type.toLowerCase().includes('PhD'.toLowerCase())) {
                  typeToSet = 'PhD';
                }

                else {
                  typeToSet = 'Other';
                }


                const monthNumber = date.split("/")[1]


                let monthToSet;
                switch (monthNumber) {

                  case 1:
                    monthToSet = 'January'
                    break;

                  case 2:
                    monthToSet = 'February';
                    break;
                  case 3:
                    monthToSet = 'March';
                    break;
                  case 4:
                    monthToSet = 'April';
                    break;
                  case 5:
                    monthToSet = 'May';
                    break;
                  case 6:
                    monthToSet = 'June';
                    break;
                  case 7:
                    monthToSet = 'July';
                    break;
                  case 8:
                    monthToSet = 'August';
                    break;
                  case 9:
                    monthToSet = 'September';
                    break;
                  case 10:
                    monthToSet = 'October';
                    break;
                  case 11:
                    monthToSet = 'November';
                    break;
                  case 12:
                    monthToSet = 'December';
                    break;

                }



                const thesisToAdd = {
                  school: school,
                  type: typeToSet,
                  month: monthToSet
                }



                if (publication.title) {
                  //Δημιουργία αντικειμένου publication
                  const createdPublication = await Publication.create(publication);

                  //Βρίσκουμε τον χρήστη από την βάση.
                  const userCreator = await User.findOne({ where: { user_id: req.userData.userId } })

                  //αφού βρούμε τον χρήστη έπειτα συνδέουμε την συγκεκριμένη δημοσίευση
                  await createdPublication.setUser(userCreator)

                  //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
                  const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
                  const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

                  //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
                  createdPublication.addPublicationcategories(allCategoryFound);
                  createdPublication.addPublicationcategories(uncategorizedFound);

                  const thesis1 = await Thesis.create(thesisToAdd);
                  await createdPublication.setThesis(thesis1)

                }





              })

            }

            const reports = rdf['bib:Report'];
            if (reports) {

              reports.forEach(async report => {


                const title = report['dc:title'][0];
                const abstract = report['dcterms:abstract'] ? report['dcterms:abstract'][0] : '';
                const organization = report['dc:publisher'][0]['foaf:Organization'][0]['foaf:name'] ? report['dc:publisher'][0]['foaf:Organization'][0]['foaf:name'][0] : "";
                const type = report['z:type'] ? report['z:type'][0] : "";

                const publication = {
                  title: title,
                  abstract: abstract,
                  section: 'Tech_Report'
                }

                const techReportToAdd = {
                  institution: organization,
                  type: type
                }

                if (publication.title) {
                  //Δημιουργία αντικειμένου publication
                  const createdPublication = await Publication.create(publication);

                  //Βρίσκουμε τον χρήστη από την βάση.
                  const userCreator = await User.findOne({ where: { user_id: req.userData.userId } })

                  //αφού βρούμε τον χρήστη έπειτα συνδέουμε την συγκεκριμένη δημοσίευση
                  await createdPublication.setUser(userCreator)

                  //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
                  const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
                  const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

                  //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
                  createdPublication.addPublicationcategories(allCategoryFound);
                  createdPublication.addPublicationcategories(uncategorizedFound);

                  const techReport1 = await TechReport.create(techReportToAdd);
                  await createdPublication.setTechReport(techReport1)
                }


              })


            }

            const standard = rdf['rdf:Description'];
            console.log("Description ..........", standard)
            if (standard) {


              standard.forEach(async description => {
                const abstract = description['dcterms:abstract'] ? description['dcterms:abstract'][0] : "";
                const title = description['dc:title'][0];
                const organization = description['dc:publisher'][0]['foaf:Organization'][0]['foaf:name'] ? description['dc:publisher'][0]['foaf:Organization'][0]['foaf:name'][0] : "";
                const authority = description['z:authority'] ? description['z:authority'][0] : "";
                const number = description['prism:number'] ? description['prism:number'][0] : "";

                const publication = {
                  title: title,
                  section: 'Proceedings',
                  abstract: abstract
                }

                const proceedingsToAdd = {
                  editor: organization,
                  organization: organization,
                  authority: authority,
                  series: number
                }

                console.log(proceedingsToAdd)


                if (publication.title) {

                  //Δημιουργία αντικειμένου publication
                  const createdPublication = await Publication.create(publication);

                  //Βρίσκουμε τον χρήστη από την βάση.
                  const userCreator = await User.findOne({ where: { user_id: req.userData.userId } })

                  //αφού βρούμε τον χρήστη έπειτα συνδέουμε την συγκεκριμένη δημοσίευση
                  await createdPublication.setUser(userCreator)

                  //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
                  const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
                  const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

                  //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
                  createdPublication.addPublicationcategories(allCategoryFound);
                  createdPublication.addPublicationcategories(uncategorizedFound);

                  const proceedings1 = await Proceeding.create(proceedingsToAdd);
                  await createdPublication.setProceeding(proceedings1)


                }



              })

            }



          })



        })


      }


      res.status(200).json({
        message: 'Publications Added successfully!'
      })

      console.log('File saved successfully');
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Error while saving the file' });
    }
  }



}


exports.export_single_publication_file = async (req, res, next) => {

  const date = new Date();

  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  // This arrangement can be altered based on how we want the date's format to appear.
  let currentDate = `${day}-${month}-${year}`;
  console.log(currentDate); // "17-6-2022"

  const userId = req.userData.userId;
  const folderPath = './uploads/' + userId;
  const filePath = './uploads/' + userId + '/user' + userId + 'pub' + req.body.publicationId + currentDate + '.bib'
  const publication_id = req.body.publicationId;
  const fileType = req.body.fileType;



  const publicationToExport = await Publication.findOne({
    include: [{ model: Tag }, 'references', 'exreferences',

    { model: Article },
    { model: Book },
    { model: Proceeding },
    { model: Thesis },
    { model: ChapterBk },
    { model: TechReport },
    { model: Other }
    ], where: { publication_id: publication_id }
  })



  console.log(publication_id.length)


  if (publicationToExport) {


    //find authors : 
    let authorNames = []
    const internalAuthors = await publicationToExport.getInternalAuthors();
    const externalAuthors = await publicationToExport.getExternalAuthors();
    for (let internalAuthor of internalAuthors) {
      authorNames.push(internalAuthor.firstName + ' ' + internalAuthor.lastName)
    }
    for (let externalAuthor of externalAuthors) {
      authorNames.push(externalAuthor.firstName + ' ' + externalAuthor.lastName)
    }




    if (fileType === '.bib') {


      console.log("AUTHOR NAMES ", authorNames)
      let authorNameToSet = [];
      if (authorNames.length > 0) {
        authorNameToSet = "authors={" + authorNames + ",}"
      }

      let objectContent;
      let keywords = [];
      for (let tag of publicationToExport.tags) {
        keywords.push(tag.keyword)
      }


      let keywordToSet;
      if (keywords.length > 0) {
        keywordToSet = "keywords={" + keywords + "}"
      }




      switch (publicationToExport.section) {

        case 'Article':

          const titleArt = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
          const abstractArt = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
          const doiArt = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
          const yearArt = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const noteArt = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
          const journalArt = publicationToExport.article.jurnal ? "journal={" + publicationToExport.article.jurnal + "}," : null;
          const volumeArt = publicationToExport.article.volume ? "volume={" + publicationToExport.article.volume + "}," : null;
          const numberArt = publicationToExport.article.number ? "number={" + publicationToExport.article.number + "}," : null;
          const pagesArt = publicationToExport.article.pages ? "pages={" + publicationToExport.article.pages + "}," : null;
          const monthArt = publicationToExport.article.month ? "month={" + publicationToExport.article.month + "}," : null;







          objectContent = `@article{${publicationToExport.publication_id},
            ${titleArt ? titleArt : ""}
            ${abstractArt ? abstractArt : ""}
            ${doiArt ? doiArt : ""}
            ${yearArt ? yearArt : ""}
            ${noteArt ? noteArt : ""}
            ${journalArt ? journalArt : ""}
            ${volumeArt ? volumeArt : ""}
            ${numberArt ? numberArt : ""}
            ${pagesArt ? pagesArt : ""}
            ${monthArt ? monthArt : ""}
            ${keywordToSet ? keywordToSet : ""}\n}
            ${authorNameToSet ? authorNameToSet : ""},

            
          }`.trim().replace(/\n\s+/g, '\n');
          console.log(objectContent)



          break;

        case 'Book':


          const titleBk = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
          const abstractBk = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
          const doiBk = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
          const yearBk = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const noteBk = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
          const publisherBk = publicationToExport.book.publisher ? "publisher={" + publicationToExport.book.publisher + "}," : null;
          const isbnBk = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
          const volumeBk = publicationToExport.book.volume ? "volume={" + publicationToExport.book.volume + "}," : null;
          const seriesBk = publicationToExport.book.series ? "series={" + publicationToExport.book.series + "}," : null;
          const pagesBk = publicationToExport.book.pages ? "pages={" + publicationToExport.book.pages + "}," : null;
          const addressBk = publicationToExport.book.address ? "address={" + publicationToExport.book.address + "}," : null;
          const monthBk = publicationToExport.book.month ? "month={" + publicationToExport.book.month + "}," : null;
          const versionBk = publicationToExport.book.version ? "edition={" + publicationToExport.book.version + "}," : null;



          objectContent = `@book{${publicationToExport.publication_id},\n
            ${titleBk ? titleBk : ""}\n
            ${abstractBk ? abstractBk : ""}\n
            ${doiBk ? doiBk : ""}\n
            ${isbnBk ? isbnBk : ""}\n
            ${yearBk ? yearBk : ""}\n
            ${noteBk ? noteBk : ""}\n
            ${publisherBk ? publisherBk : ""}\n
            ${volumeBk ? volumeBk : ""}\n
            ${seriesBk ? seriesBk : ""}\n
            ${pagesBk ? pagesBk : ""}\n
            ${addressBk ? addressBk : ""}\n
            ${versionBk ? versionBk : ""}\n
            ${monthBk ? monthBk : ""}\n
            ${keywordToSet ? keywordToSet : ""}\n
            ${authorNameToSet ? authorNameToSet : ""}\n
          }`.trim().replace(/\n\s+/g, '\n');
          break;

        case 'Proceedings':

          const isbn = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
          const title = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
          const abstract = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
          const doi = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
          const year = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const note = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
          const publisher = publicationToExport.proceeding.publisher ? 'publisher={' + publicationToExport.proceeding.publisher + "}," : null;
          const pages = publicationToExport.proceeding.pages ? 'pages={' + publicationToExport.proceeding.pages + "}," : null;
          const editor = publicationToExport.proceeding.editor ? 'editor={' + publicationToExport.editor + "}," : null;
          const series = publicationToExport.proceeding.series ? 'series={' + publicationToExport.proceeding.series + "}," : null;
          const address = publicationToExport.proceeding.address ? 'address={' + publicationToExport.proceeding.address + "}," : null;
          const month = publicationToExport.proceeding.month ? 'month={' + publicationToExport.proceeding.month + "}," : null;
          const organization = publicationToExport.proceeding.organization ? 'organization={' + publicationToExport.proceeding.organization + '},' : null;



          objectContent = `@inproceedings{${publicationToExport.publication_id}\n,
          ${title ? title : ""}\n
          ${abstract ? abstract : ""}\n
          ${isbn ? isbn : ""}\n
          ${doi ? doi : ""}\n
          ${year ? year : ""}\n
          ${note ? note : ""}\n
          ${publisher ? publisher : ""}\n
          ${editor ? editor : ""}\n
          ${pages ? pages : ""}\n
          ${series ? series : ""}\n
          ${address ? address : ""}\n
          ${month ? month : ""}\n
          ${organization ? organization : ""}\n
          ${keywordToSet ? keywordToSet : ""}\n}
          ${authorNameToSet ? authorNameToSet : ""}\n
          `.trim().replace(/\n\s+/g, '\n');

          break;

        case 'Thesis':

          const isbnTh = publicationToExport.isbn ? 'isbn=' + publicationToExport.isbn + "," : null;
          const titleTh = publicationToExport.title ? 'title=' + publicationToExport.title + "," : null;
          const abstractTh = publicationToExport.abstract ? 'abstract=' + publicationToExport.abstract + "," : null;
          const doiTh = publicationToExport.doi ? 'doi=' + publicationToExport.doi + "," : null;
          const yearTh = publicationToExport.year ? 'year=' + publicationToExport.year + "," : null;
          const noteTh = publicationToExport.notes ? 'note=' + publicationToExport.notes + "," : null;
          const typeTh = publicationToExport.thesis.type ? 'type=' + publicationToExport.thesis.type + "," : null;
          const monthTh = publicationToExport.thesis.month ? 'month=' + publicationToExport.thesis.month + "," : null;
          const addressTh = publicationToExport.thesis.address ? 'address=' + publicationToExport.thesis.address + "," : null;

          let typeToSet;
          if (publicationToExport.thesis.type === 'Master') {
            typeToSet = 'masterthesis'
          }
          else {
            typeToSet = 'phdthesis'
          }

          objectContent = `@${typeToSet}{${publicationToExport.publication_id}\n
          ${titleTh ? titleTh : ""}\n
          ${abstractTh ? abstractTh : ""}\n
          ${doiTh ? doiTh : ""}\n
          ${yearTh ? yearTh : ""}\n
          ${noteTh ? noteTh : ""}\n
          ${typeTh ? typeTh : ""}\n
          ${monthTh ? monthTh : ""}\n
          ${authorNameToSet ? authorNameToSet : ""}\n
          ${addressTh ? addressTh : ""}}`.trim().replace(/\n\s+/g, '\n');

          break;


        case 'Book_Chapter':
          const isbnBC = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
          const titleBC = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
          const abstractBC = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
          const doiBC = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
          const yearBC = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const noteBC = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;

          const chapter = publicationToExport.chapterBk.chapter ? 'chapter={' + publicationToExport.chapterBk.chapter + "}," : null;
          const publisherBc = publicationToExport.chapterBk.publisher ? 'publisher={' + publicationToExport.chapterBk.publisher + "}," : null;
          const volumeBc = publicationToExport.chapterBk.volume ? 'volume={' + publicationToExport.chapterBk.volume + "}," : null;
          const seriesBc = publicationToExport.chapterBk.series ? 'series={' + publicationToExport.chapterBk.series + "}," : null;
          const typeBc = publicationToExport.chapterBk.type ? 'type={' + publicationToExport.chapterBk.type + "}," : null;
          const addressBc = publicationToExport.chapterBk.address ? 'address={' + publicationToExport.chapterBk.address + "}," : null;
          const monthBc = publicationToExport.chapterBk.month ? 'month={' + publicationToExport.chapterBk.month + "}," : null;
          const editionBc = publicationToExport.chapterBk.version ? 'edition={' + publicationToExport.chapterBk.version + "}," : null;




          objectContent = `@inbook{${publicationToExport.publication_id},\n
          ${titleBC ? titleBC : ""}\n
          ${isbnBC ? isbnBC : ""}\n
          ${abstractBC ? abstractBC : ""}\n
          ${doiBC ? doiBC : ""}\n
          ${yearBC ? yearBC : ""}\n
          ${noteBC ? noteBC : ""}\n
          ${chapter ? chapter : ""}\n
          ${publisherBc ? publisherBc : ""}\n
          ${volumeBc ? volumeBc : ""}\n
          ${seriesBc ? seriesBc : ""}\n
          ${typeBc ? typeBc : ""}\n
          ${addressBc ? addressBc : ""}\n
          ${monthBc ? monthBc : ""}\n
          ${editionBc ? editionBc : ""}\n}
          ${authorNameToSet ? authorNameToSet : ""}\n
          ${keywordToSet ? keywordToSet : ""}`.trim().replace(/\n\s+/g, '\n');
          break;

        case 'Tech_Report':

          const isbnTR = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
          const titleTR = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
          const abstractTR = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
          const doiTR = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
          const yearTR = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const noteTR = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;

          const institutionTR = publicationToExport.techReport.institution ? 'institution={' + publicationToExport.techReport.institution + "}," : null;
          const typeTr = publicationToExport.techReport.type ? 'publisher={' + publicationToExport.techReport.type + "}," : null;
          const numberTR = publicationToExport.techReport.number ? 'volume={' + publicationToExport.techReport.number + "}," : null;
          const addressTR = publicationToExport.techReport.series ? 'series={' + publicationToExport.techReport.series + "}," : null;
          const monthTR = publicationToExport.techReport.month ? 'note={' + publicationToExport.techReport.month + "}," : null;


          objectContent = `@techreport{${publicationToExport.publication_id},\n
          ${titleTR ? titleTR : ""}\n
          ${isbnTR ? isbnTR : ""}\n
          ${abstractTR ? abstractTR : ""}\n
          ${doiTR ? doiTR : ""}\n
          ${yearTR ? yearTR : ""}\n
          ${noteTR ? noteTR : ""}\n
          ${institutionTR ? institutionTR : ""}\n
          ${typeTr ? typeTr : ""}\n
          ${numberTR ? numberTR : ""}\n
          ${addressTR ? addressTR : ""}\n
          ${monthTR ? monthTR : ""}\n
          ${authorNameToSet ? authorNameToSet : ""}\n
          ${keywordToSet ? keywordToSet : ""}}`.trim().replace(/\n\s+/g, '\n');


          break;

        case 'Other':
          const newline = '\n';
          const isbnOT = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," + newline : null;
          const titleOT = publicationToExport.title ? 'title={' + publicationToExport.title + "}," + newline : null;
          const abstractOT = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "},\n" : null;
          const doiOT = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "},\n" : null;
          const yearOT = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const noteOT = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
          const typeOT = publicationToExport.other.type ? 'publisher={' + publicationToExport.other.type + "},\n" : null;
          const pagesOT = publicationToExport.other.number ? 'volume={' + publicationToExport.other.number + "},\n" : null;
          const monthOT = publicationToExport.other.series ? 'series={' + publicationToExport.other.series + "},\n" : null;
          const numberOT = publicationToExport.other.number ? 'volume={' + publicationToExport.other.number + "},\n" : null;

          objectContent = `@otherType{${publicationToExport.publication_id},\n${authorNameToSet ? authorNameToSet : ""},\n${titleOT ? titleOT : ""}${abstractOT ? abstractOT : ""}${doiOT ? doiOT : ""}${yearOT ? yearOT : ""}${isbnOT ? isbnOT : ""}${noteOT ? noteOT : ""}${typeOT ? typeOT : ""}${pagesOT ? pagesOT : ""}${monthOT ? monthOT : ""}${numberOT ? numberOT : ""}
          ${keywordToSet ? keywordToSet : ""}}`.trim().replace(/\n\s+/g, '\n');

          break;
      }
      const filename = '/user' + userId + 'pub' + req.body.publicationId + currentDate + '.bib';
      res.setHeader('Content-Type', 'text/x-bibtex;charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(objectContent);

    }

    else if (fileType === '.rdf') {


      let typeContentInside;



      console.log(publicationToExport.section)
      switch (publicationToExport.section) {

        case 'Article':

          typeContentInside = `<bib:Article rdf:about="#item_1">
          <z:itemType>journalArticle</z:itemType>
          <dcterms:isPartOf>
              <bib:Journal>
                  <dcterms:isPartOf>
                     <bib:Series><dc:title>${publicationToExport.title}</dc:title></bib:Series>
                  </dcterms:isPartOf>
                  <prism:volume>${publicationToExport.article.volume ? publicationToExport.article.volume : ""}</prism:volume>
                  <dc:identifier>${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
                  <prism:number>${publicationToExport.article.number ? publicationToExport.article.number : ""}</prism:number>
                  <dcterms:alternative>${publicationToExport.article.jurnal ? publicationToExport.article.jurnal : ""}</dcterms:alternative>
              </bib:Journal>
          </dcterms:isPartOf>
          <bib:authors>
              <rdf:Seq>
                  <rdf:li>
                      <foaf:Person>
                         <foaf:surname>${authorNames}</foaf:surname>
                      </foaf:Person>
                  </rdf:li>
              </rdf:Seq>
          </bib:authors>
          <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
          <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
          <dc:date>${publicationToExport.article.month ? publicationToExport.article.month : ""}/${publicationToExport.year}</dc:date>
          <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
          <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
          <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
          <dc:description>${publicationToExport.article.number ? publicationToExport.article.number : ""}</dc:description>
          <bib:pages>${publicationToExport.article.pages ? publicationToExport.article.pages : ""}</bib:pages>
          </bib:Article>`
          break;


        case 'Book':

          typeContentInside = `<bib:Book rdf:about="urn:isbn:${publicationToExport.isbn ? publicationToExport.isbn : ""}">
          <z:itemType>book</z:itemType>
          <dcterms:isPartOf>
             <bib:Series><dc:title>${publicationToExport.book.series ? publicationToExport.book.series : ""}</dc:title></bib:Series>
          </dcterms:isPartOf>
          <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
          <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
          <prism:volume>${publicationToExport.book.volume ? publicationToExport.book.volume : ""}</prism:volume>
          <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
          <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
          <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
          <prism:edition>${publicationToExport.book.publisher ? publicationToExport.book.publisher : ""}</prism:edition>
          <z:numPages>${publicationToExport.book.pages ? publicationToExport.book.pages : ""}</z:numPages>
          <dc:coverage>${publicationToExport.book.address ? publicationToExport.book.address : ""}</dc:coverage>
      </bib:Book>`
          break;


        case 'Book_Chapter':

          typeContentInside = `<bib:BookSection rdf:about="#item_11">
            <z:itemType>bookSection</z:itemType>
            <dcterms:isPartOf>
                <bib:Book>
                    <dcterms:isPartOf>
                       <bib:Series><dc:title>${publicationToExport.chapterBk.series ? publicationToExport.chapterBk.series : ""}</dc:title></bib:Series>
                    </dcterms:isPartOf>
                    <prism:volume>${publicationToExport.chapterBk.volume ? publicationToExport.chapterBk.volume : ""}</prism:volume>
                    <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
                    <dc:coverage>${publicationToExport.chapterBk.address ? publicationToExport.chapterBk.address : ""}</dc:coverage>
                    <z:type>${publicationToExport.chapterBk.type ? publicationToExport.chapterBk.type : ""}</z:type>
                </bib:Book>
            </dcterms:isPartOf>
            <dc:publisher>
             <foaf:Organization><foaf:name>${publicationToExport.chapterBk.publisher ? publicationToExport.chapterBk.publisher : ""}</foaf:name></foaf:Organization>
            </dc:publisher>
            <dc:title>${publicationToExport.chapterBk.chapter ? publicationToExport.chapterBk.chapter : ""}</dc:title>
            <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
            <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
            <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
            <dc:description>${publicationToExport.chapterBk.type ? publicationToExport.chapterBk.type : ""}</dc:description>
            <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
            <dc:date>${publicationToExport.chapterBk.month ? publicationToExport.chapterBk.month : ""}/${publicationToExport.year ? publicationToExport.year : ""}</dc:date>
            <bib:pages>${publicationToExport.chapterBk.pages ? publicationToExport.chapterBk.pages : ""}</bib:pages>
            <prism:edition>${publicationToExport.chapterBk.version ? publicationToExport.chapterBk.version : ""}</prism:edition>
            <dc:coverage>${publicationToExport.chapterBk.address ? publicationToExport.chapterBk.address : ""}</dc:coverage>
            <dc:description>${publicationToExport.chapterBk.publisher ? publicationToExport.chapterBk.publisher : ""}</dc:description>
        </bib:BookSection>`
          break;


        case 'Proceedings':
          typeContentInside = `<rdf:Description rdf:about="#item_14">
              <z:itemType>standard</z:itemType>
              <dc:publisher>
                  <foaf:Organization>
                     <foaf:name>${publicationToExport.proceeding.editor ? publicationToExport.proceeding.editor : ""}</foaf:name>
                  </foaf:Organization>
              </dc:publisher>
              <prism:edition>${publicationToExport.proceeding.series ? publicationToExport.proceeding.series : ""}</prism:edition>
              <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
              <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
              <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
              <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
              <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
              <z:authority>${publicationToExport.proceeding.organization ? publicationToExport.proceeding.organization : ""}</z:authority>
              <dc:address>${publicationToExport.proceeding.address ? publicationToExport.proceeding.address : ""}</dc:address>
              <dc:coverage>${publicationToExport.proceeding.address ? publicationToExport.proceeding.address : ""}</dc:coverage>
              <z:numPages>${publicationToExport.proceeding.pages ? publicationToExport.proceeding.pages : ""}</z:numPages>
              <z:committee>${publicationToExport.proceeding.publisher ? publicationToExport.proceeding.publisher : ""}</z:committee>
              <dcterms:issued>${publicationToExport.year ? publicationToExport.year : ""}-${publicationToExport.proceeding.month ? publicationToExport.proceeding.month : ""}</dcterms:issued>
          </rdf:Description>`
          break;


        case 'Thesis':

          typeContentInside = `<bib:Thesis rdf:about="#item_12">
              <z:itemType>thesis</z:itemType>
              <dc:publisher>
                  <foaf:Organization>
                    <foaf:name>${publicationToExport.thesis.school ? publicationToExport.thesis.school : ""}</foaf:name>
                  </foaf:Organization>
              </dc:publisher>
              <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
              <dc:date>${publicationToExport.year ? publicationToExport.year : ""}-${publicationToExport.thesis.month ? publicationToExport.thesis.month : ""}</dc:date>
              <z:type>${publicationToExport.thesis.type ? publicationToExport.thesis.type : ""}</z:type>
              <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
              <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
              <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
              <dc:coverage>${publicationToExport.thesis.address ? publicationToExport.thesis.address : ""}</dc:coverage>
              <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
            </bib:Thesis>`
          break;


        case 'Tech_Report':

          typeContentInside = `<bib:Report rdf:about="#item_13">
            <z:itemType>report</z:itemType>
            <dc:publisher>
                <foaf:Organization>
                    <foaf:name>${publicationToExport.techReport.institution ? publicationToExport.techReport.institution : ""}</foaf:name>
                </foaf:Organization>
            </dc:publisher>
            <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
            <dc:date>${publicationToExport.year ? publicationToExport.year : ""} - ${publicationToExport.techReport.month ? publicationToExport.techReport.month : ""}</dc:date>
            <z:type>${publicationToExport.techReport.type ? publicationToExport.techReport.type : ""}</z:type>
            <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
            <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
            <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
            <dc:date> ${publicationToExport.year ? publicationToExport.year : ""}</dc:date>
            <dc:description> ${publicationToExport.techReport.tech_report_year ? publicationToExport.techReport.tech_report_year : ""}</dc:description>
            <dc:description> ${publicationToExport.notes ? publicationToExport.notes : ""}</dc:description>
            <dc:coverage>${publicationToExport.techReport.address ? publicationToExport.techReport.address : ""}</dc:coverage>          
            <prism:number>${publicationToExport.techReport.number ? publicationToExport.techReport.number : ""}</prism:number>
            <prism:month>${publicationToExport.techReport.month ? publicationToExport.techReport.month : ""}</prism:month>
            <z:type>Technical Report</z:type>
        </bib:Report>`
          break;

        case 'Other':
          typeContentInside = `<bib:Report rdf:about="#item_1">
            <z:itemType>report</z:itemType>
            <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
            <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
            <dc:date>${publicationToExport.year ? publicationToExport.year : ""}</dc:date>
            <z:type>${publicationToExport.other.subType ? publicationToExport.other.subType : ""}</z:type>
            
            <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
            <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
            <z:numPages>${publicationToExport.other.pages ? publicationToExport.other.pages : ""}</z:numPages>
            <prism:number>${publicationToExport.other.grantNumber ? publicationToExport.other.grantNumber : ""}</prism:number>
            <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}</dc:description>
        </bib:Report>`
          break;
      }


      let objectContent = `<rdf:RDF
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns:z="http://www.zotero.org/namespaces/export#"
        xmlns:dcterms="http://purl.org/dc/terms/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:bib="http://purl.org/net/biblio#"
        xmlns:prism="http://prismstandard.org/namespaces/1.2/basic/"
        xmlns:foaf="http://xmlns.com/foaf/0.1/">
        ${typeContentInside}
       </rdf:RDF>
       `
      const filename = '/user' + userId + 'pub' + req.body.publicationId + currentDate + '.rdf';
      res.setHeader('Content-Type', 'application/rdf+xml;charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(objectContent);





    }

    else {

    }

  }



}


exports.export_multiple_publications_file = async (req, res, next) => {
  const date = new Date();

  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  // This arrangement can be altered based on how we want the date's format to appear.
  let currentDate = `${day}-${month}-${year}`;
  const publicationIds = req.body.publicationIds;
  const fileType = req.body.fileType;
  console.log(fileType)
  const userId = req.userData.userId;

  let objectContent = '';
  let typeContentInside = '';
  for (let id of publicationIds) {

    console.log("publicationIds", publicationIds)
    const publicationToExport = await Publication.findOne({
      include: [{ model: Tag }, 'references', 'exreferences',

      { model: Article },
      { model: Book },
      { model: Proceeding },
      { model: Thesis },
      { model: ChapterBk },
      { model: TechReport },
      { model: Other }
      ], where: { publication_id: id }
    })

    console.log("TITLE", publicationToExport.title);


    //find authors : 
    let authorNames = []
    const internalAuthors = await publicationToExport.getInternalAuthors();
    const externalAuthors = await publicationToExport.getExternalAuthors();
    for (let internalAuthor of internalAuthors) {
      authorNames.push(internalAuthor.firstName + ' ' + internalAuthor.lastName)
    }
    for (let externalAuthor of externalAuthors) {
      authorNames.push(externalAuthor.firstName + ' ' + externalAuthor.lastName)
    }


    let authorNameToSet = [];
    if (authorNames.length > 0) {
      authorNameToSet = "authors={" + authorNames + ",}"
    }


    if (fileType === '.bib') {

      let keywords = [];
      for (let tag of publicationToExport.tags) {
        keywords.push(tag.keyword)
      }


      let keywordToSet;
      if (keywords.length > 0) {
        keywordToSet = "keywords={" + keywords + "}"
      }

      console.log("AUTHOR NAMES ", authorNames)
      let authorNameToSet = [];
      if (authorNames.length > 0) {
        authorNameToSet = "authors={" + authorNames + ",}"
      }




      switch (publicationToExport.section) {

        case 'Article':

          const titleArt = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
          const abstractArt = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
          const doiArt = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
          const yearArt = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const noteArt = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
          const journalArt = publicationToExport.article.jurnal ? "journal={" + publicationToExport.article.jurnal + "}," : null;
          const volumeArt = publicationToExport.article.volume ? "volume={" + publicationToExport.article.volume + "}," : null;
          const numberArt = publicationToExport.article.number ? "number={" + publicationToExport.article.number + "}," : null;
          const pagesArt = publicationToExport.article.pages ? "pages={" + publicationToExport.article.pages + "}," : null;
          const monthArt = publicationToExport.article.month ? "month={" + publicationToExport.article.month + "}," : null;







          objectContent += `@article{${publicationToExport.publication_id},
            ${titleArt ? titleArt : ""}
            ${abstractArt ? abstractArt : ""}
            ${doiArt ? doiArt : ""}
            ${yearArt ? yearArt : ""}
            ${noteArt ? noteArt : ""}
            ${journalArt ? journalArt : ""}
            ${volumeArt ? volumeArt : ""}
            ${numberArt ? numberArt : ""}
            ${pagesArt ? pagesArt : ""}
            ${monthArt ? monthArt : ""}
            ${keywordToSet ? keywordToSet : ""}\n}
            ${authorNameToSet ? authorNameToSet : ""},

            
          }`.trim().replace(/\n\s+/g, '\n');
          console.log(objectContent)



          break;

        case 'Book':


          const titleBk = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
          const abstractBk = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
          const doiBk = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
          const yearBk = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const noteBk = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
          const publisherBk = publicationToExport.book.publisher ? "publisher={" + publicationToExport.book.publisher + "}," : null;
          const isbnBk = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
          const volumeBk = publicationToExport.book.volume ? "volume={" + publicationToExport.book.volume + "}," : null;
          const seriesBk = publicationToExport.book.series ? "series={" + publicationToExport.book.series + "}," : null;
          const pagesBk = publicationToExport.book.pages ? "pages={" + publicationToExport.book.pages + "}," : null;
          const addressBk = publicationToExport.book.address ? "address={" + publicationToExport.book.address + "}," : null;
          const monthBk = publicationToExport.book.month ? "month={" + publicationToExport.book.month + "}," : null;
          const versionBk = publicationToExport.book.version ? "edition={" + publicationToExport.book.version + "}," : null;



          objectContent += `@book{${publicationToExport.publication_id},\n
            ${titleBk ? titleBk : ""}\n
            ${abstractBk ? abstractBk : ""}\n
            ${doiBk ? doiBk : ""}\n
            ${isbnBk ? isbnBk : ""}\n
            ${yearBk ? yearBk : ""}\n
            ${noteBk ? noteBk : ""}\n
            ${publisherBk ? publisherBk : ""}\n
            ${volumeBk ? volumeBk : ""}\n
            ${seriesBk ? seriesBk : ""}\n
            ${pagesBk ? pagesBk : ""}\n
            ${addressBk ? addressBk : ""}\n
            ${versionBk ? versionBk : ""}\n
            ${monthBk ? monthBk : ""}\n
            ${keywordToSet ? keywordToSet : ""}\n
            ${authorNameToSet ? authorNameToSet : ""}\n
          }`.trim().replace(/\n\s+/g, '\n');
          break;

        case 'Proceedings':

          const isbn = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
          const title = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
          const abstract = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
          const doi = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
          const year = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const note = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
          const publisher = publicationToExport.proceeding.publisher ? 'publisher={' + publicationToExport.proceeding.publisher + "}," : null;
          const pages = publicationToExport.proceeding.pages ? 'pages={' + publicationToExport.proceeding.pages + "}," : null;
          const editor = publicationToExport.proceeding.editor ? 'editor={' + publicationToExport.editor + "}," : null;
          const series = publicationToExport.proceeding.series ? 'series={' + publicationToExport.proceeding.series + "}," : null;
          const address = publicationToExport.proceeding.address ? 'address={' + publicationToExport.proceeding.address + "}," : null;
          const month = publicationToExport.proceeding.month ? 'month={' + publicationToExport.proceeding.month + "}," : null;
          const organization = publicationToExport.proceeding.organization ? 'organization={' + publicationToExport.proceeding.organization + '},' : null;



          objectContent += `@inproceedings{${publicationToExport.publication_id}\n,
          ${title ? title : ""}\n
          ${abstract ? abstract : ""}\n
          ${isbn ? isbn : ""}\n
          ${doi ? doi : ""}\n
          ${year ? year : ""}\n
          ${note ? note : ""}\n
          ${publisher ? publisher : ""}\n
          ${editor ? editor : ""}\n
          ${pages ? pages : ""}\n
          ${series ? series : ""}\n
          ${address ? address : ""}\n
          ${month ? month : ""}\n
          ${organization ? organization : ""}\n
          ${keywordToSet ? keywordToSet : ""}\n}
          ${authorNameToSet ? authorNameToSet : ""}\n
          `.trim().replace(/\n\s+/g, '\n');

          break;

        case 'Thesis':

          const isbnTh = publicationToExport.isbn ? 'isbn=' + publicationToExport.isbn + "," : null;
          const titleTh = publicationToExport.title ? 'title=' + publicationToExport.title + "," : null;
          const abstractTh = publicationToExport.abstract ? 'abstract=' + publicationToExport.abstract + "," : null;
          const doiTh = publicationToExport.doi ? 'doi=' + publicationToExport.doi + "," : null;
          const yearTh = publicationToExport.year ? 'year=' + publicationToExport.year + "," : null;
          const noteTh = publicationToExport.notes ? 'note=' + publicationToExport.notes + "," : null;
          const typeTh = publicationToExport.thesis.type ? 'type=' + publicationToExport.thesis.type + "," : null;
          const monthTh = publicationToExport.thesis.month ? 'month=' + publicationToExport.thesis.month + "," : null;
          const addressTh = publicationToExport.thesis.address ? 'address=' + publicationToExport.thesis.address + "," : null;

          let typeToSet;
          if (publicationToExport.thesis.type === 'Master') {
            typeToSet = 'masterthesis'
          }
          else {
            typeToSet = 'phdthesis'
          }

          objectContent += `@${typeToSet}{${publicationToExport.publication_id}\n
          ${titleTh ? titleTh : ""}\n
          ${abstractTh ? abstractTh : ""}\n
          ${doiTh ? doiTh : ""}\n
          ${yearTh ? yearTh : ""}\n
          ${noteTh ? noteTh : ""}\n
          ${typeTh ? typeTh : ""}\n
          ${monthTh ? monthTh : ""}\n
          ${authorNameToSet ? authorNameToSet : ""}\n
          ${addressTh ? addressTh : ""}}`.trim().replace(/\n\s+/g, '\n');

          break;


        case 'Book_Chapter':
          const isbnBC = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
          const titleBC = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
          const abstractBC = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
          const doiBC = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
          const yearBC = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const noteBC = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;

          const chapter = publicationToExport.chapterBk.chapter ? 'chapter={' + publicationToExport.chapterBk.chapter + "}," : null;
          const publisherBc = publicationToExport.chapterBk.publisher ? 'publisher={' + publicationToExport.chapterBk.publisher + "}," : null;
          const volumeBc = publicationToExport.chapterBk.volume ? 'volume={' + publicationToExport.chapterBk.volume + "}," : null;
          const seriesBc = publicationToExport.chapterBk.series ? 'series={' + publicationToExport.chapterBk.series + "}," : null;
          const typeBc = publicationToExport.chapterBk.type ? 'type={' + publicationToExport.chapterBk.type + "}," : null;
          const addressBc = publicationToExport.chapterBk.address ? 'address={' + publicationToExport.chapterBk.address + "}," : null;
          const monthBc = publicationToExport.chapterBk.month ? 'month={' + publicationToExport.chapterBk.month + "}," : null;
          const editionBc = publicationToExport.chapterBk.version ? 'edition={' + publicationToExport.chapterBk.version + "}," : null;




          objectContent += `@inbook{${publicationToExport.publication_id},\n
          ${titleBC ? titleBC : ""}\n
          ${isbnBC ? isbnBC : ""}\n
          ${abstractBC ? abstractBC : ""}\n
          ${doiBC ? doiBC : ""}\n
          ${yearBC ? yearBC : ""}\n
          ${noteBC ? noteBC : ""}\n
          ${chapter ? chapter : ""}\n
          ${publisherBc ? publisherBc : ""}\n
          ${volumeBc ? volumeBc : ""}\n
          ${seriesBc ? seriesBc : ""}\n
          ${typeBc ? typeBc : ""}\n
          ${addressBc ? addressBc : ""}\n
          ${monthBc ? monthBc : ""}\n
          ${editionBc ? editionBc : ""}\n}
          ${authorNameToSet ? authorNameToSet : ""}\n
          ${keywordToSet ? keywordToSet : ""}`.trim().replace(/\n\s+/g, '\n');
          break;

        case 'Tech_Report':

          const isbnTR = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
          const titleTR = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
          const abstractTR = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
          const doiTR = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
          const yearTR = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const noteTR = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;

          const institutionTR = publicationToExport.techReport.institution ? 'institution={' + publicationToExport.techReport.institution + "}," : null;
          const typeTr = publicationToExport.techReport.type ? 'publisher={' + publicationToExport.techReport.type + "}," : null;
          const numberTR = publicationToExport.techReport.number ? 'volume={' + publicationToExport.techReport.number + "}," : null;
          const addressTR = publicationToExport.techReport.series ? 'series={' + publicationToExport.techReport.series + "}," : null;
          const monthTR = publicationToExport.techReport.month ? 'note={' + publicationToExport.techReport.month + "}," : null;


          objectContent += `@techreport{${publicationToExport.publication_id},\n
          ${titleTR ? titleTR : ""}\n
          ${isbnTR ? isbnTR : ""}\n
          ${abstractTR ? abstractTR : ""}\n
          ${doiTR ? doiTR : ""}\n
          ${yearTR ? yearTR : ""}\n
          ${noteTR ? noteTR : ""}\n
          ${institutionTR ? institutionTR : ""}\n
          ${typeTr ? typeTr : ""}\n
          ${numberTR ? numberTR : ""}\n
          ${addressTR ? addressTR : ""}\n
          ${monthTR ? monthTR : ""}\n
          ${authorNameToSet ? authorNameToSet : ""}\n
          ${keywordToSet ? keywordToSet : ""}}`.trim().replace(/\n\s+/g, '\n');


          break;

        case 'Other':
          const newline = '\n';
          const isbnOT = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," + newline : null;
          const titleOT = publicationToExport.title ? 'title={' + publicationToExport.title + "}," + newline : null;
          const abstractOT = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "},\n" : null;
          const doiOT = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "},\n" : null;
          const yearOT = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
          const noteOT = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
          const typeOT = publicationToExport.other.type ? 'publisher={' + publicationToExport.other.type + "},\n" : null;
          const pagesOT = publicationToExport.other.number ? 'volume={' + publicationToExport.other.number + "},\n" : null;
          const monthOT = publicationToExport.other.series ? 'series={' + publicationToExport.other.series + "},\n" : null;
          const numberOT = publicationToExport.other.number ? 'volume={' + publicationToExport.other.number + "},\n" : null;

          objectContent += `@otherType{${publicationToExport.publication_id},\n${authorNameToSet ? authorNameToSet : ""},\n${titleOT ? titleOT : ""}${abstractOT ? abstractOT : ""}${doiOT ? doiOT : ""}${yearOT ? yearOT : ""}${isbnOT ? isbnOT : ""}${noteOT ? noteOT : ""}${typeOT ? typeOT : ""}${pagesOT ? pagesOT : ""}${monthOT ? monthOT : ""}${numberOT ? numberOT : ""}
          ${keywordToSet ? keywordToSet : ""}}`.trim().replace(/\n\s+/g, '\n');

          break;
      }


    }

    if (fileType === '.rdf') {





      console.log(publicationToExport.section)
      switch (publicationToExport.section) {

        case 'Article':

          typeContentInside += `<bib:Article rdf:about="#item_${publicationToExport.publication_id}">
          <z:itemType>journalArticle</z:itemType>
          <dcterms:isPartOf>
              <bib:Journal>
                  <dcterms:isPartOf>
                     <bib:Series><dc:title>${publicationToExport.title}</dc:title></bib:Series>
                  </dcterms:isPartOf>
                  <prism:volume>${publicationToExport.article.volume ? publicationToExport.article.volume : ""}</prism:volume>
                  <dc:identifier>${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
                  <prism:number>${publicationToExport.article.number ? publicationToExport.article.number : ""}</prism:number>
                  <dcterms:alternative>${publicationToExport.article.jurnal ? publicationToExport.article.jurnal : ""}</dcterms:alternative>
              </bib:Journal>
          </dcterms:isPartOf>
          <bib:authors>
              <rdf:Seq>
                  <rdf:li>
                      <foaf:Person>
                         <foaf:surname>Author 1</foaf:surname>
                      </foaf:Person>
                  </rdf:li>
              </rdf:Seq>
          </bib:authors>
          <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
          <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
          <dc:date>${publicationToExport.article.month ? publicationToExport.article.month : ""}/${publicationToExport.year}</dc:date>
          <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
          <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
          <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
          <dc:description>${publicationToExport.article.number ? publicationToExport.article.number : ""}</dc:description>
          <bib:pages>${publicationToExport.article.pages ? publicationToExport.article.pages : ""}</bib:pages>
          </bib:Article>`+ '\n'
          console.log(typeContentInside)
          break;


        case 'Book':

          typeContentInside += `<bib:Book rdf:about="#item_${publicationToExport.publication_id}">
          <z:itemType>book</z:itemType>
          <dcterms:isPartOf>
             <bib:Series><dc:title>${publicationToExport.book.series ? publicationToExport.book.series : ""}</dc:title></bib:Series>
          </dcterms:isPartOf>
          <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
          <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
          <prism:volume>${publicationToExport.book.volume ? publicationToExport.book.volume : ""}</prism:volume>
          <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
          <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
          <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
          <prism:edition>${publicationToExport.book.publisher ? publicationToExport.book.publisher : ""}</prism:edition>
          <z:numPages>${publicationToExport.book.pages ? publicationToExport.book.pages : ""}</z:numPages>
          <dc:coverage>${publicationToExport.book.address ? publicationToExport.book.address : ""}</dc:coverage>
      </bib:Book>`
          break;


        case 'Book_Chapter':

          typeContentInside += `<bib:BookSection rdf:about="#item_${publicationToExport.publication_id}">
            <z:itemType>bookSection</z:itemType>
            <dcterms:isPartOf>
                <bib:Book>
                    <dcterms:isPartOf>
                       <bib:Series><dc:title>${publicationToExport.chapterBk.series ? publicationToExport.chapterBk.series : ""}</dc:title></bib:Series>
                    </dcterms:isPartOf>
                    <prism:volume>${publicationToExport.chapterBk.volume ? publicationToExport.chapterBk.volume : ""}</prism:volume>
                    <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
                    <dc:coverage>${publicationToExport.chapterBk.address ? publicationToExport.chapterBk.address : ""}</dc:coverage>
                    <z:type>${publicationToExport.chapterBk.type ? publicationToExport.chapterBk.type : ""}</z:type>
                </bib:Book>
            </dcterms:isPartOf>
            <dc:publisher>
             <foaf:Organization><foaf:name>${publicationToExport.chapterBk.publisher ? publicationToExport.chapterBk.publisher : ""}</foaf:name></foaf:Organization>
            </dc:publisher>
            <dc:title>${publicationToExport.chapterBk.chapter ? publicationToExport.chapterBk.chapter : ""}</dc:title>
            <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
            <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
            <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
            <dc:description>${publicationToExport.chapterBk.type ? publicationToExport.chapterBk.type : ""}</dc:description>
            <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
            <dc:date>${publicationToExport.chapterBk.month ? publicationToExport.chapterBk.month : ""}/${publicationToExport.year ? publicationToExport.year : ""}</dc:date>
            <bib:pages>${publicationToExport.chapterBk.pages ? publicationToExport.chapterBk.pages : ""}</bib:pages>
            <prism:edition>${publicationToExport.chapterBk.version ? publicationToExport.chapterBk.version : ""}</prism:edition>
            <dc:coverage>${publicationToExport.chapterBk.address ? publicationToExport.chapterBk.address : ""}</dc:coverage>
            <dc:description>${publicationToExport.chapterBk.publisher ? publicationToExport.chapterBk.publisher : ""}</dc:description>
        </bib:BookSection>`+ '\n'
          break;


        case 'Proceedings':
          typeContentInside += `<rdf:Description rdf:about="#item_#item_${publicationToExport.publication_id}">
              <z:itemType>standard</z:itemType>
              <dc:publisher>
                  <foaf:Organization>
                     <foaf:name>${publicationToExport.proceeding.editor ? publicationToExport.proceeding.editor : ""}</foaf:name>
                  </foaf:Organization>
              </dc:publisher>
              <prism:edition>${publicationToExport.proceeding.series ? publicationToExport.proceeding.series : ""}</prism:edition>
              <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
              <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
              <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
              <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
              <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
              <z:authority>${publicationToExport.proceeding.organization ? publicationToExport.proceeding.organization : ""}</z:authority>
              <dc:address>${publicationToExport.proceeding.address ? publicationToExport.proceeding.address : ""}</dc:address>
              <dc:coverage>${publicationToExport.proceeding.address ? publicationToExport.proceeding.address : ""}</dc:coverage>
              <z:numPages>${publicationToExport.proceeding.pages ? publicationToExport.proceeding.pages : ""}</z:numPages>
              <z:committee>${publicationToExport.proceeding.publisher ? publicationToExport.proceeding.publisher : ""}</z:committee>
              <dcterms:issued>${publicationToExport.year ? publicationToExport.year : ""}-${publicationToExport.proceeding.month ? publicationToExport.proceeding.month : ""}</dcterms:issued>
          </rdf:Description>`+ '\n'
          break;


        case 'Thesis':

          typeContentInside += `<bib:Thesis rdf:about="#item_#item_${publicationToExport.publication_id}">
              <z:itemType>thesis</z:itemType>
              <dc:publisher>
                  <foaf:Organization>
                    <foaf:name>${publicationToExport.thesis.school ? publicationToExport.thesis.school : ""}</foaf:name>
                  </foaf:Organization>
              </dc:publisher>
              <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
              <dc:date>${publicationToExport.year ? publicationToExport.year : ""}-${publicationToExport.thesis.month ? publicationToExport.thesis.month : ""}</dc:date>
              <z:type>${publicationToExport.thesis.type ? publicationToExport.thesis.type : ""}</z:type>
              <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
              <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
              <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
              <dc:coverage>${publicationToExport.thesis.address ? publicationToExport.thesis.address : ""}</dc:coverage>
              <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
            </bib:Thesis>`+ '\n'
          break;


        case 'Tech_Report':

          typeContentInside += `<bib:Report rdf:about="#item_${publicationToExport.publication_id}">
            <z:itemType>report</z:itemType>
            <dc:publisher>
                <foaf:Organization>
                    <foaf:name>${publicationToExport.techReport.institution ? publicationToExport.techReport.institution : ""}</foaf:name>
                </foaf:Organization>
            </dc:publisher>
            <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
            <dc:date>${publicationToExport.year ? publicationToExport.year : ""} - ${publicationToExport.techReport.month ? publicationToExport.techReport.month : ""}</dc:date>
            <z:type>${publicationToExport.techReport.type ? publicationToExport.techReport.type : ""}</z:type>
            <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
            <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
            <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
            <dc:date> ${publicationToExport.year ? publicationToExport.year : ""}</dc:date>
            <dc:description> ${publicationToExport.techReport.tech_report_year ? publicationToExport.techReport.tech_report_year : ""}</dc:description>
            <dc:description> ${publicationToExport.notes ? publicationToExport.notes : ""}</dc:description>
            <dc:coverage>${publicationToExport.techReport.address ? publicationToExport.techReport.address : ""}</dc:coverage>          
            <prism:number>${publicationToExport.techReport.number ? publicationToExport.techReport.number : ""}</prism:number>
            <prism:month>${publicationToExport.techReport.month ? publicationToExport.techReport.month : ""}</prism:month>
            <z:type>Technical Report</z:type>
        </bib:Report>`+ '\n'
          break;

        case 'Other':
          typeContentInside += `<bib:Report rdf:about="#item_${publicationToExport.publication_id}">
            <z:itemType>report</z:itemType>
            <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
            <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
            <dc:date>${publicationToExport.year ? publicationToExport.year : ""}</dc:date>
            <z:type>${publicationToExport.other.subType ? publicationToExport.other.subType : ""}</z:type>
            
            <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
            <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
            <z:numPages>${publicationToExport.other.pages ? publicationToExport.other.pages : ""}</z:numPages>
            <prism:number>${publicationToExport.other.grantNumber ? publicationToExport.other.grantNumber : ""}</prism:number>
            <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}</dc:description>
        </bib:Report>`+ '\n'
          break;
      }





    }




  }



  if (fileType === '.bib') {
    const filename = '/user' + userId + 'pub' + req.body.publicationId + currentDate + '.bib';
    res.setHeader('Content-Type', 'text/x-bibtex;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(objectContent);
  }

  if (fileType === '.rdf') {
    let objectContentRdf = `<rdf:RDF
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns:z="http://www.zotero.org/namespaces/export#"
        xmlns:dcterms="http://purl.org/dc/terms/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:bib="http://purl.org/net/biblio#"
        xmlns:prism="http://prismstandard.org/namespaces/1.2/basic/"
        xmlns:foaf="http://xmlns.com/foaf/0.1/">
        ${typeContentInside}
       </rdf:RDF>
       `
    const filename = '/user' + userId + 'pub' + req.body.publicationId + currentDate + '.rdf';
    res.setHeader('Content-Type', 'text/x-bibtex;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(objectContentRdf);
  }



}


exports.export_publications_category = async (req, res, next) => {

  const date = new Date();

  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  // This arrangement can be altered based on how we want the date's format to appear.
  let currentDate = `${day}-${month}-${year}`;
  const publicationIds = req.body.publicationIds;
  const fileType = req.body.fileType;
  console.log(fileType)
  const userId = req.userData.userId;





  const categeryFound = await Category.findOne({ where: { category_id: req.body.categoryId, userId: req.userData.userId } });
  let objectContent = '';
  let typeContentInside = '';
  if (categeryFound) {


    const publications = await categeryFound.getPublicationcategories();

    const publicationIds = [];

    for (let pub of publications) {

      publicationIds.push(pub.publication_id)
    }

    console.log(publicationIds);
    console.log(fileType);

    for (let id of publicationIds) {

      console.log(id)
      const publicationToExport = await Publication.findOne({
        include: [{ model: Tag }, 'references', 'exreferences',

        { model: Article },
        { model: Book },
        { model: Proceeding },
        { model: Thesis },
        { model: ChapterBk },
        { model: TechReport },
        { model: Other }
        ], where: { publication_id: id }
      })

      console.log("TITLE", publicationToExport.title);

      //find authors : 
      let authorNames = []
      const internalAuthors = await publicationToExport.getInternalAuthors();
      const externalAuthors = await publicationToExport.getExternalAuthors();
      for (let internalAuthor of internalAuthors) {
        authorNames.push(internalAuthor.firstName + ' ' + internalAuthor.lastName)
      }
      for (let externalAuthor of externalAuthors) {
        authorNames.push(externalAuthor.firstName + ' ' + externalAuthor.lastName)
      }



      if (fileType === '.bib') {


        let authorNameToSet = [];
        if (authorNames.length > 0) {
          authorNameToSet = "authors={" + authorNames + ",}"
        }

        let keywords = [];
        for (let tag of publicationToExport.tags) {
          keywords.push(tag.keyword)
        }


        let keywordToSet;
        if (keywords.length > 0) {
          keywordToSet = "keywords={" + keywords + "}"
        }

        switch (publicationToExport.section) {

          case 'Article':

            const titleArt = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
            const abstractArt = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
            const doiArt = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
            const yearArt = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
            const noteArt = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
            const journalArt = publicationToExport.article.jurnal ? "journal={" + publicationToExport.article.jurnal + "}," : null;
            const volumeArt = publicationToExport.article.volume ? "volume={" + publicationToExport.article.volume + "}," : null;
            const numberArt = publicationToExport.article.number ? "number={" + publicationToExport.article.number + "}," : null;
            const pagesArt = publicationToExport.article.pages ? "pages={" + publicationToExport.article.pages + "}," : null;
            const monthArt = publicationToExport.article.month ? "month={" + publicationToExport.article.month + "}," : null;



            console.log(titleArt)


            objectContent += `\n@article{${publicationToExport.publication_id},
              ${titleArt ? titleArt : ""}\n
              ${abstractArt ? abstractArt : ""}\n
              ${doiArt ? doiArt : ""}\n
              ${yearArt ? yearArt : ""}\n
              ${noteArt ? noteArt : ""}\n
              ${journalArt ? journalArt : ""}\n
              ${volumeArt ? volumeArt : ""}\n
              ${numberArt ? numberArt : ""}\n
              ${pagesArt ? pagesArt : ""}\n
              ${monthArt ? monthArt : ""}\n
              ${keywordToSet ? keywordToSet : ""}\n
              ${authorNameToSet ? authorNameToSet : ""}\n
            }`.trim().replace(/\n\s+/g, '\n') + '\n\n';;



            break;

          case 'Book':


            const titleBk = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
            const abstractBk = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
            const doiBk = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
            const yearBk = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
            const noteBk = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
            const publisherBk = publicationToExport.book.publisher ? "publisher={" + publicationToExport.book.publisher + "}," : null;
            const isbnBk = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
            const volumeBk = publicationToExport.book.volume ? "volume={" + publicationToExport.book.volume + "}," : null;
            const seriesBk = publicationToExport.book.series ? "series={" + publicationToExport.book.series + "}," : null;
            const pagesBk = publicationToExport.book.pages ? "pages={" + publicationToExport.book.pages + "}," : null;
            const addressBk = publicationToExport.book.address ? "address={" + publicationToExport.book.address + "}," : null;
            const monthBk = publicationToExport.book.month ? "month={" + publicationToExport.book.month + "}," : null;
            const versionBk = publicationToExport.book.version ? "edition={" + publicationToExport.book.version + "}," : null;



            objectContent += `@book{${publicationToExport.publication_id},\n
              ${titleBk ? titleBk : ""}\n
              ${abstractBk ? abstractBk : ""}\n
              ${doiBk ? doiBk : ""}\n
              ${isbnBk ? isbnBk : ""}\n
              ${yearBk ? yearBk : ""}\n
              ${noteBk ? noteBk : ""}\n
              ${publisherBk ? publisherBk : ""}\n
              ${volumeBk ? volumeBk : ""}\n
              ${seriesBk ? seriesBk : ""}\n
              ${pagesBk ? pagesBk : ""}\n
              ${addressBk ? addressBk : ""}\n
              ${versionBk ? versionBk : ""}\n
              ${monthBk ? monthBk : ""}\n
              ${keywordToSet ? keywordToSet : ""}\n
              ${authorNameToSet ? authorNameToSet : ""}\n
            }`.trim().replace(/\n\s+/g, '\n') + '\n\n';
            break;

          case 'Proceedings':

            const isbn = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
            const title = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
            const abstract = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
            const doi = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
            const year = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
            const note = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
            const publisher = publicationToExport.proceeding.publisher ? 'publisher={' + publicationToExport.proceeding.publisher + "}," : null;
            const pages = publicationToExport.proceeding.pages ? 'pages={' + publicationToExport.proceeding.pages + "}," : null;
            const editor = publicationToExport.proceeding.editor ? 'editor={' + publicationToExport.editor + "}," : null;
            const series = publicationToExport.proceeding.series ? 'series={' + publicationToExport.proceeding.series + "}," : null;
            const address = publicationToExport.proceeding.address ? 'address={' + publicationToExport.proceeding.address + "}," : null;
            const month = publicationToExport.proceeding.month ? 'month={' + publicationToExport.proceeding.month + "}," : null;
            const organization = publicationToExport.proceeding.organization ? 'organization={' + publicationToExport.proceeding.organization + '},' : null;



            objectContent += `@inproceedings{${publicationToExport.publication_id}\n,
            ${title ? title : ""}\n
            ${abstract ? abstract : ""}\n
            ${isbn ? isbn : ""}\n
            ${doi ? doi : ""}\n
            ${year ? year : ""}\n
            ${note ? note : ""}\n
            ${publisher ? publisher : ""}\n
            ${editor ? editor : ""}\n
            ${pages ? pages : ""}\n
            ${series ? series : ""}\n
            ${address ? address : ""}\n
            ${month ? month : ""}\n
            ${organization ? organization : ""}\n
            ${authorNameToSet ? authorNameToSet : ""}\n
            ${keywordToSet ? keywordToSet : ""}}
            `.trim().replace(/\n\s+/g, '\n') + '\n\n';

            break;

          case 'Thesis':

            const isbnTh = publicationToExport.isbn ? 'isbn=' + publicationToExport.isbn + "," : null;
            const titleTh = publicationToExport.title ? 'title=' + publicationToExport.title + "," : null;
            const abstractTh = publicationToExport.abstract ? 'abstract=' + publicationToExport.abstract + "," : null;
            const doiTh = publicationToExport.doi ? 'doi=' + publicationToExport.doi + "," : null;
            const yearTh = publicationToExport.year ? 'year=' + publicationToExport.year + "," : null;
            const noteTh = publicationToExport.notes ? 'note=' + publicationToExport.notes + "," : null;
            const typeTh = publicationToExport.thesis.type ? 'type=' + publicationToExport.thesis.type + "," : null;
            const monthTh = publicationToExport.thesis.month ? 'month=' + publicationToExport.thesis.month + "," : null;
            const addressTh = publicationToExport.thesis.address ? 'address=' + publicationToExport.thesis.address + "," : null;

            let typeToSet;
            if (publicationToExport.thesis.type === 'Master') {
              typeToSet = 'masterthesis'
            }
            else {
              typeToSet = 'phdthesis'
            }

            objectContent += `@${typeToSet}{${publicationToExport.publication_id}\n
            ${titleTh ? titleTh : ""}\n
            ${abstractTh ? abstractTh : ""}\n
            ${doiTh ? doiTh : ""}\n
            ${yearTh ? yearTh : ""}\n
            ${noteTh ? noteTh : ""}\n
            ${typeTh ? typeTh : ""}\n
            ${monthTh ? monthTh : ""}\n
            ${authorNameToSet ? authorNameToSet : ""}\n
            ${addressTh ? addressTh : ""}}`.trim().replace(/\n\s+/g, '\n') + '\n\n';

            break;


          case 'Book_Chapter':
            const isbnBC = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
            const titleBC = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
            const abstractBC = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
            const doiBC = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
            const yearBC = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
            const noteBC = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;

            const chapter = publicationToExport.chapterBk.chapter ? 'chapter={' + publicationToExport.chapterBk.chapter + "}," : null;
            const publisherBc = publicationToExport.chapterBk.publisher ? 'publisher={' + publicationToExport.chapterBk.publisher + "}," : null;
            const volumeBc = publicationToExport.chapterBk.volume ? 'volume={' + publicationToExport.chapterBk.volume + "}," : null;
            const seriesBc = publicationToExport.chapterBk.series ? 'series={' + publicationToExport.chapterBk.series + "}," : null;
            const typeBc = publicationToExport.chapterBk.type ? 'type={' + publicationToExport.chapterBk.type + "}," : null;
            const addressBc = publicationToExport.chapterBk.address ? 'address={' + publicationToExport.chapterBk.address + "}," : null;
            const monthBc = publicationToExport.chapterBk.month ? 'month={' + publicationToExport.chapterBk.month + "}," : null;
            const editionBc = publicationToExport.chapterBk.version ? 'edition={' + publicationToExport.chapterBk.version + "}," : null;




            objectContent += `@inbook{${publicationToExport.publication_id},\n
            ${titleBC ? titleBC : ""}\n
            ${isbnBC ? isbnBC : ""}\n
            ${abstractBC ? abstractBC : ""}\n
            ${doiBC ? doiBC : ""}\n
            ${yearBC ? yearBC : ""}\n
            ${noteBC ? noteBC : ""}\n
            ${chapter ? chapter : ""}\n
            ${publisherBc ? publisherBc : ""}\n
            ${volumeBc ? volumeBc : ""}\n
            ${seriesBc ? seriesBc : ""}\n
            ${typeBc ? typeBc : ""}\n
            ${addressBc ? addressBc : ""}\n
            ${monthBc ? monthBc : ""}\n
            ${editionBc ? editionBc : ""}\n}
            ${authorNameToSet ? authorNameToSet : ""}\n

            ${keywordToSet ? keywordToSet : ""}`.trim().replace(/\n\s+/g, '\n') + '\n\n';
            break;

          case 'Tech_Report':

            const isbnTR = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," : null;
            const titleTR = publicationToExport.title ? 'title={' + publicationToExport.title + "}," : null;
            const abstractTR = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "}," : null;
            const doiTR = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "}," : null;
            const yearTR = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
            const noteTR = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;

            const institutionTR = publicationToExport.techReport.institution ? 'institution={' + publicationToExport.techReport.institution + "}," : null;
            const typeTr = publicationToExport.techReport.type ? 'publisher={' + publicationToExport.techReport.type + "}," : null;
            const numberTR = publicationToExport.techReport.number ? 'volume={' + publicationToExport.techReport.number + "}," : null;
            const addressTR = publicationToExport.techReport.series ? 'series={' + publicationToExport.techReport.series + "}," : null;
            const monthTR = publicationToExport.techReport.month ? 'note={' + publicationToExport.techReport.month + "}," : null;


            objectContent += `@techreport{${publicationToExport.publication_id},\n
            ${titleTR ? titleTR : ""}\n
            ${isbnTR ? isbnTR : ""}\n
            ${abstractTR ? abstractTR : ""}\n
            ${doiTR ? doiTR : ""}\n
            ${yearTR ? yearTR : ""}\n
            ${noteTR ? noteTR : ""}\n
            ${institutionTR ? institutionTR : ""}\n
            ${typeTr ? typeTr : ""}\n
            ${numberTR ? numberTR : ""}\n
            ${addressTR ? addressTR : ""}\n
            ${monthTR ? monthTR : ""}\n
            ${authorNameToSet ? authorNameToSet : ""}\n
            ${keywordToSet ? keywordToSet : ""}}`.trim().replace(/\n\s+/g, '\n') + '\n\n';


            break;

          case 'Other':
            const newline = '\n';
            const isbnOT = publicationToExport.isbn ? 'isbn={' + publicationToExport.isbn + "}," + newline : null;
            const titleOT = publicationToExport.title ? 'title={' + publicationToExport.title + "}," + newline : null;
            const abstractOT = publicationToExport.abstract ? 'abstract={' + publicationToExport.abstract + "},\n" : null;
            const doiOT = publicationToExport.doi ? 'doi={' + publicationToExport.doi + "},\n" : null;
            const yearOT = publicationToExport.year ? 'year={' + publicationToExport.year + "}," : null;
            const noteOT = publicationToExport.notes ? 'note={' + publicationToExport.notes + "}," : null;
            const typeOT = publicationToExport.other.type ? 'publisher={' + publicationToExport.other.type + "},\n" : null;
            const pagesOT = publicationToExport.other.number ? 'volume={' + publicationToExport.other.number + "},\n" : null;
            const monthOT = publicationToExport.other.series ? 'series={' + publicationToExport.other.series + "},\n" : null;
            const numberOT = publicationToExport.other.number ? 'volume={' + publicationToExport.other.number + "},\n" : null;


            objectContent += `\n@otherType{${publicationToExport.publication_id},\n${authorNameToSet ? authorNameToSet : ""}\n ${titleOT ? titleOT : ""}${abstractOT ? abstractOT : ""}${doiOT ? doiOT : ""}${yearOT ? yearOT : ""}${isbnOT ? isbnOT : ""}${noteOT ? noteOT : ""}${typeOT ? typeOT : ""}${pagesOT ? pagesOT : ""}${monthOT ? monthOT : ""}${numberOT ? numberOT : ""}
            ${keywordToSet ? keywordToSet : ""}}`.trim().replace(/\n\s+/g, '\n') + '\n\n';
            break;
        }


      }

      if (fileType === '.rdf') {





        console.log(publicationToExport.section)
        switch (publicationToExport.section) {

          case 'Article':

            typeContentInside += `<bib:Article rdf:about="#item_${publicationToExport.publication_id}">
            <z:itemType>journalArticle</z:itemType>
            <dcterms:isPartOf>
                <bib:Journal>
                    <dcterms:isPartOf>
                       <bib:Series><dc:title>${publicationToExport.title}</dc:title></bib:Series>
                    </dcterms:isPartOf>
                    <prism:volume>${publicationToExport.article.volume ? publicationToExport.article.volume : ""}</prism:volume>
                    <dc:identifier>${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
                    <prism:number>${publicationToExport.article.number ? publicationToExport.article.number : ""}</prism:number>
                    <dcterms:alternative>${publicationToExport.article.jurnal ? publicationToExport.article.jurnal : ""}</dcterms:alternative>
                </bib:Journal>
            </dcterms:isPartOf>
            <bib:authors>
                <rdf:Seq>
                    <rdf:li>
                        <foaf:Person>
                           <foaf:surname>Author 1</foaf:surname>
                        </foaf:Person>
                    </rdf:li>
                </rdf:Seq>
            </bib:authors>
            <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
            <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
            <dc:date>${publicationToExport.article.month ? publicationToExport.article.month : ""}/${publicationToExport.year}</dc:date>
            <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
            <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
            <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
            <dc:description>${publicationToExport.article.number ? publicationToExport.article.number : ""}</dc:description>
            <bib:pages>${publicationToExport.article.pages ? publicationToExport.article.pages : ""}</bib:pages>
            </bib:Article>`
            console.log(typeContentInside)
            break;


          case 'Book':

            typeContentInside += `<bib:Book rdf:about="#item_${publicationToExport.publication_id}">
            <z:itemType>book</z:itemType>
            <dcterms:isPartOf>
               <bib:Series><dc:title>${publicationToExport.book.series ? publicationToExport.book.series : ""}</dc:title></bib:Series>
            </dcterms:isPartOf>
            <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
            <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
            <prism:volume>${publicationToExport.book.volume ? publicationToExport.book.volume : ""}</prism:volume>
            <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
            <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
            <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
            <prism:edition>${publicationToExport.book.publisher ? publicationToExport.book.publisher : ""}</prism:edition>
            <z:numPages>${publicationToExport.book.pages ? publicationToExport.book.pages : ""}</z:numPages>
            <dc:coverage>${publicationToExport.book.address ? publicationToExport.book.address : ""}</dc:coverage>
        </bib:Book>`
            break;


          case 'Book_Chapter':

            typeContentInside += `<bib:BookSection rdf:about="#item_${publicationToExport.publication_id}">
              <z:itemType>bookSection</z:itemType>
              <dcterms:isPartOf>
                  <bib:Book>
                      <dcterms:isPartOf>
                         <bib:Series><dc:title>${publicationToExport.chapterBk.series ? publicationToExport.chapterBk.series : ""}</dc:title></bib:Series>
                      </dcterms:isPartOf>
                      <prism:volume>${publicationToExport.chapterBk.volume ? publicationToExport.chapterBk.volume : ""}</prism:volume>
                      <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
                      <dc:coverage>${publicationToExport.chapterBk.address ? publicationToExport.chapterBk.address : ""}</dc:coverage>
                      <z:type>${publicationToExport.chapterBk.type ? publicationToExport.chapterBk.type : ""}</z:type>
                  </bib:Book>
              </dcterms:isPartOf>
              <dc:publisher>
               <foaf:Organization><foaf:name>${publicationToExport.chapterBk.publisher ? publicationToExport.chapterBk.publisher : ""}</foaf:name></foaf:Organization>
              </dc:publisher>
              <dc:title>${publicationToExport.chapterBk.chapter ? publicationToExport.chapterBk.chapter : ""}</dc:title>
              <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
              <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
              <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
              <dc:description>${publicationToExport.chapterBk.type ? publicationToExport.chapterBk.type : ""}</dc:description>
              <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
              <dc:date>${publicationToExport.chapterBk.month ? publicationToExport.chapterBk.month : ""}/${publicationToExport.year ? publicationToExport.year : ""}</dc:date>
              <bib:pages>${publicationToExport.chapterBk.pages ? publicationToExport.chapterBk.pages : ""}</bib:pages>
              <prism:edition>${publicationToExport.chapterBk.version ? publicationToExport.chapterBk.version : ""}</prism:edition>
              <dc:coverage>${publicationToExport.chapterBk.address ? publicationToExport.chapterBk.address : ""}</dc:coverage>
              <dc:description>${publicationToExport.chapterBk.publisher ? publicationToExport.chapterBk.publisher : ""}</dc:description>
          </bib:BookSection>`
            break;


          case 'Proceedings':
            typeContentInside += `<rdf:Description rdf:about="#item_${publicationToExport.publication_id}">
                <z:itemType>standard</z:itemType>
                <dc:publisher>
                    <foaf:Organization>
                       <foaf:name>${publicationToExport.proceeding.editor ? publicationToExport.proceeding.editor : ""}</foaf:name>
                    </foaf:Organization>
                </dc:publisher>
                <prism:edition>${publicationToExport.proceeding.series ? publicationToExport.proceeding.series : ""}</prism:edition>
                <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
                <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
                <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
                <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
                <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
                <z:authority>${publicationToExport.proceeding.organization ? publicationToExport.proceeding.organization : ""}</z:authority>
                <dc:address>${publicationToExport.proceeding.address ? publicationToExport.proceeding.address : ""}</dc:address>
                <dc:coverage>${publicationToExport.proceeding.address ? publicationToExport.proceeding.address : ""}</dc:coverage>
                <z:numPages>${publicationToExport.proceeding.pages ? publicationToExport.proceeding.pages : ""}</z:numPages>
                <z:committee>${publicationToExport.proceeding.publisher ? publicationToExport.proceeding.publisher : ""}</z:committee>
                <dcterms:issued>${publicationToExport.year ? publicationToExport.year : ""}-${publicationToExport.proceeding.month ? publicationToExport.proceeding.month : ""}</dcterms:issued>
            </rdf:Description>`
            break;


          case 'Thesis':

            typeContentInside += `<bib:Thesis rdf:about="#item_${publicationToExport.publication_id}">
                <z:itemType>thesis</z:itemType>
                <dc:publisher>
                    <foaf:Organization>
                      <foaf:name>${publicationToExport.thesis.school ? publicationToExport.thesis.school : ""}</foaf:name>
                    </foaf:Organization>
                </dc:publisher>
                <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
                <dc:date>${publicationToExport.year ? publicationToExport.year : ""}-${publicationToExport.thesis.month ? publicationToExport.thesis.month : ""}</dc:date>
                <z:type>${publicationToExport.thesis.type ? publicationToExport.thesis.type : ""}</z:type>
                <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
                <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
                <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
                <dc:coverage>${publicationToExport.thesis.address ? publicationToExport.thesis.address : ""}</dc:coverage>
                <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}.</dc:description>
              </bib:Thesis>`
            break;


          case 'Tech_Report':

            typeContentInside += `<bib:Report rdf:about="#item_${publicationToExport.publication_id}">
              <z:itemType>report</z:itemType>
              <dc:publisher>
                  <foaf:Organization>
                      <foaf:name>${publicationToExport.techReport.institution ? publicationToExport.techReport.institution : ""}</foaf:name>
                  </foaf:Organization>
              </dc:publisher>
              <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
              <dc:date>${publicationToExport.year ? publicationToExport.year : ""} - ${publicationToExport.techReport.month ? publicationToExport.techReport.month : ""}</dc:date>
              <z:type>${publicationToExport.techReport.type ? publicationToExport.techReport.type : ""}</z:type>
              <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
              <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
              <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
              <dc:date> ${publicationToExport.year ? publicationToExport.year : ""}</dc:date>
              <dc:description> ${publicationToExport.techReport.tech_report_year ? publicationToExport.techReport.tech_report_year : ""}</dc:description>
              <dc:description> ${publicationToExport.notes ? publicationToExport.notes : ""}</dc:description>
              <dc:coverage>${publicationToExport.techReport.address ? publicationToExport.techReport.address : ""}</dc:coverage>          
              <prism:number>${publicationToExport.techReport.number ? publicationToExport.techReport.number : ""}</prism:number>
              <prism:month>${publicationToExport.techReport.month ? publicationToExport.techReport.month : ""}</prism:month>
              <z:type>Technical Report</z:type>
          </bib:Report>`
            break;

          case 'Other':
            typeContentInside += `<bib:Report rdf:about="#item_${publicationToExport.publication_id}">
              <z:itemType>report</z:itemType>
              <dc:title>${publicationToExport.title ? publicationToExport.title : ""}</dc:title>
              <dcterms:abstract>${publicationToExport.abstract ? publicationToExport.abstract : ""}</dcterms:abstract>
              <dc:date>${publicationToExport.year ? publicationToExport.year : ""}</dc:date>
              <z:type>${publicationToExport.other.subType ? publicationToExport.other.subType : ""}</z:type>
              
              <dc:identifier>ISBN ${publicationToExport.isbn ? publicationToExport.isbn : ""}</dc:identifier>
              <dc:identifier>DOI ${publicationToExport.doi ? publicationToExport.doi : ""}</dc:identifier>
              <z:numPages>${publicationToExport.other.pages ? publicationToExport.other.pages : ""}</z:numPages>
              <prism:number>${publicationToExport.other.grantNumber ? publicationToExport.other.grantNumber : ""}</prism:number>
              <dc:description>${publicationToExport.notes ? publicationToExport.notes : ""}</dc:description>
          </bib:Report>`
            break;
        }





      }




    }



    if (fileType === '.bib') {
      const filename = '/user' + userId + 'pub' + req.body.publicationId + currentDate + '.bib';
      res.setHeader('Content-Type', 'text/x-bibtex;charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(objectContent);
    }

    if (fileType === '.rdf') {
      let objectContentRdf = `<rdf:RDF
          xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
          xmlns:z="http://www.zotero.org/namespaces/export#"
          xmlns:dcterms="http://purl.org/dc/terms/"
          xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns:bib="http://purl.org/net/biblio#"
          xmlns:prism="http://prismstandard.org/namespaces/1.2/basic/"
          xmlns:foaf="http://xmlns.com/foaf/0.1/">
          ${typeContentInside}
         </rdf:RDF>
         `
      const filename = '/user' + userId + 'pub' + req.body.publicationId + currentDate + '.rdf';
      res.setHeader('Content-Type', 'text/x-bibtex;charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(objectContentRdf);
    }


  }

}


exports.get_simple_internal_live_publications = async (req, res, next) => {


  const query = req.body.query;

  const type = req.body.type;

  console.log(type)


  if (type === 'All') {


    let resultForPublicationTitleBased = await Publication.findAll({
      where: {
        title: {
          [Op.like]: `${query.toLowerCase()}%`
        }
      }
    })


    let resultForPublicationAbstractBased = await Publication.findAll({
      where: {
        abstract: {
          [Op.like]: `${query.toLowerCase()}%`
        }
      }
    })


    let resultForPublicationYearBased = await Publication.findAll({
      where: {
        year: {
          [Op.like]: `${query.toLowerCase()}%`
        }
      }
    })


    //////-----------------In progresss-----------------//////////
    let resultForPublicationAuthorBased;
    let resultForToposBased;



    res.status(200).json({
      publicationsTitleBased: resultForPublicationTitleBased,
      publicationsAbstractBased: resultForPublicationAbstractBased,
      publiactionYearBased: resultForPublicationYearBased
    })

    console.log(resultForPublicationTitleBased)

  }

  else if (type === 'My') {


    let resultForPublicationTitleBased = await Publication.findAll({
      where: {
        title: {
          [Op.like]: `${query.toLowerCase()}%`
        },
        userId: req.userData.userId
      }
    })


    let resultForPublicationAbstractBased = await Publication.findAll({
      where: {
        abstract: {
          [Op.like]: `${query.toLowerCase()}%`
        },
        userId: req.userData.userId
      }
    })


    let resultForPublicationYearBased = await Publication.findAll({
      where: {
        year: {
          [Op.like]: `${query.toLowerCase()}%`
        },
        userId: req.userData.userId
      }
    })


    //////-----------------In progresss-----------------//////////
    let resultForPublicationAuthorBased;
    let resultForToposBased;



    res.status(200).json({
      publicationsTitleBased: resultForPublicationTitleBased,
      publicationsAbstractBased: resultForPublicationAbstractBased,
      publiactionYearBased: resultForPublicationYearBased
    })

    console.log(resultForPublicationTitleBased)

  }




}


exports.get_shopisticated_internal_publications_result = async (req, res, next) => {


  const objectSearch = req.body;


  console.log(objectSearch);
  const title = objectSearch.title ? objectSearch.title : null;
  //----in progreess ---------
  const author = objectSearch.author ? objectSearch.author : null;
  //----in progreess ---------
  const workShop = objectSearch.workshop ? objectSearch.workshop : null;
  const abstract = objectSearch.abstract ? objectSearch.abstract : null;
  let startYear = objectSearch.startYear ? objectSearch.startYear : null;
  let endYear = objectSearch.endYear ? objectSearch.endYear : null;

  //Καθορισμός του φίλτρου για την μη εφαρμογή των χρονολογιών
  const disableYearFilter = objectSearch.disableYearFilter;
  if (disableYearFilter) {
    startYear = null;
    endYear = null
  }

  let myPublicationsResult = []

  //Σε περίπτωση που κάνει αναζήτηση μόνο των δικών του δημοσιεύσεων
  if (objectSearch.type === 'My') {



    let whereCondition = {};

    if (title) {
      whereCondition.title = {
        [Op.like]: `${title.toLowerCase()}%`
      };
    }

    if (abstract) {
      whereCondition.abstract = {
        [Op.like]: `${abstract.toLowerCase()}%`
      };
    }

    if (author) {
      whereCondition.author = {
        [Op.like]: `${author.toLowerCase()}%`
      };
    }

    if (workShop) {
      whereCondition.workshop = {
        [Op.like]: `${workShop.toLowerCase()}%`
      };
    }

    if (startYear && endYear) {
      whereCondition.year = {
        [Op.between]: [startYear, endYear]
      };
    }

    let myPublicationsResult = await Publication.findAll({
      where: whereCondition
    });

    res.status(200).json({
      message: 'Publications found',
      publicationShopisticatedResults: myPublicationsResult
    })

  }

  //Σε περίπτωση που κάνει αναζήτηση όλων δημοσιεύσεων
  else if (req.body.type === 'All') {

    let whereCondition = {};

    if (title) {
      whereCondition.title = {
        [Op.like]: `${title.toLowerCase()}%`
      };
    }

    if (abstract) {
      whereCondition.abstract = {
        [Op.like]: `${abstract.toLowerCase()}%`
      };
    }

    if (author) {

      const authorFullName = author.split(" ");

      const internalUsers = await User.findAll({
        where: {
          firstName: authorFullName[0],
          lastName: authorFullName[1],
        },
        include: [{
          model: Publication,
          as: 'internalAuthoredPublications',
          through: { attributes: [] } // To exclude join table attributes
        }]
      });

      for (let internalAuthor of internalUsers) {

        for (let publication of internalAuthor.internalAuthoredPublications) {

          if (startYear && endYear) {
            if (parseInt(publication.year) >= parseInt(startYear) && parseInt(publication.year) <= parseInt(endYear)) {
              myPublicationsResult.push(publication)
            }
          }

          if (abstract) {
            if (publication.abstract.match(abstract)) {
              myPublicationsResult.push(publication)
            }
          }


          if (title) {
            if (publication.title === title) {
              myPublicationsResult.push(publication)
            }
          }

        }
      }


      const externalAuthors = await ExternalAuthor.findAll({
        where: {
          firstName: authorFullName[0],
          lastName: authorFullName[1],
        },
        include: [{
          model: Publication,
          as: 'externalAuthoredPublications',
          through: { attributes: [] } // To exclude join table attributes
        }]
      });

      for (let externalAuthor of externalAuthors) {

        for (let publication of externalAuthor.externalAuthoredPublications) {
          if (parseInt(publication.year) >= parseInt(startYear) && parseInt(publication.year) <= parseInt(endYear)) {
            myPublicationsResult.push(publication)
          }

          if (abstract) {
            if (publication.abstract.match(abstract)) {
              myPublicationsResult.push(publication)
            }
          }


          if (title) {
            if (publication.title === title) {
              myPublicationsResult.push(publication)
            }
          }
        }
      }

    }

    if (workShop) {
      whereCondition.workshop = {
        [Op.like]: `${workShop.toLowerCase()}%`
      };
    }

    if (startYear && endYear) {
      whereCondition.year = {
        [Op.between]: [startYear, endYear]
      };
    }

    let myPublicationsResults = await Publication.findAll({
      where: whereCondition
    });

    for (let publication of myPublicationsResults) {

      if (!author) {
        myPublicationsResult.push(publication)
      }

    }


    console.log(myPublicationsResult)
    res.status(200).json({
      message: 'Publications found',
      publicationShopisticatedResults: myPublicationsResult
    })

  }

}


exports.upload_publication_file = async (req, res, next) => {


  console.log("UPLOAD DATA PUBLICATION METHOD")

  try {



    //παίρνουμε το user id
    const userId = req.userData.userId;
    //Βρίσκουμε την Δημοσίευση
    const createdPublication = await Publication.findByPk(req.params.id);

    console.log(userId)

    let contentFileId;
    //Αρχικά παίρνουμε το contentFile αν υπάρχει τότε δημιουργούμε το αντίστοιχο αντικείμενο, το αποθηκεύουμε στην βάση και κάνουμε την συσχέτιση με την Δημοσίευση
    if (req.files['contentFile']) {

      const accessForContentFile = req.body.contentFileAccess;
      const contentFile = req.files['contentFile'][0];
      const folderPath = './uploads/' + userId;
      const fileName = contentFile.originalname;
      const filePath = folderPath + '/' + fileName;
      const file = contentFile;
      const targetDirectory = `./uploads/${userId}/${createdPublication.publication_id}/${accessForContentFile}`;
      const targetPath = `${targetDirectory}/${file.originalname}`;



      //Δημιουργία αντικειμένου
      const fileObj = {
        filename: fileName,
        type: path.extname(filePath),
        path: targetPath,
        access: accessForContentFile
      }

      console.log(fileObj)


      //Ψάχνουμε να βρούμε το content File αντικείμενο με ακριβώς τα ίδια πεδία
      const contentFileFound = await ContentFile.findOne({ where: { filename: fileObj.filename, type: fileObj.type, access: fileObj.access, publicationId: createdPublication.publication_id } })

      //Αν δεν βρεθεί συνεχίζουμε στην δημιουργία του αντικειμένου και στην αποθήκευση του αρχείου τοπικά
      if (!contentFileFound) {
        //Αποθήκευση αντικειμένου ContentFile
        const contentFileCreated = await ContentFile.create(fileObj);
        //Συσχέτιση Δημοσίευσης με το αρχείο
        await createdPublication.addContentFile(contentFileCreated);

        //Αποθήκευση id σε μεταβλητή για να το επιστρέψουμε στο front end
        contentFileId = contentFileCreated.content_file_id
        if (!fs.existsSync(targetDirectory)) {
          fs.mkdirSync(targetDirectory, { recursive: true });
        }

        fs.renameSync(file.path, targetPath);

      }



    }


    let presentantionFileId;
    if (req.files['presentantionFile']) {

      const accessForPresentantionFile = req.body.presentantionFileAccess;

      const presentantionFile = req.files['presentantionFile'][0];
      const folderPath = './uploads/' + userId;
      const fileName = presentantionFile.originalname;
      const filePath = folderPath + '/' + fileName;
      const file = presentantionFile;
      const targetDirectory = `./uploads/${userId}/${createdPublication.publication_id}/${accessForPresentantionFile}`;
      const targetPath = `${targetDirectory}/${file.originalname}`;

      //Δημιουργία αντικειμένου
      const fileObj = {
        filename: fileName,
        type: path.extname(filePath),
        path: targetPath,
        access: accessForPresentantionFile
      }


      //Ψάχνουμε να βρούμε το content File αντικείμενο με ακριβώς τα ίδια πεδία
      const presentantionFileFound = await PresentantionFile.findOne({ where: { filename: fileObj.filename, type: fileObj.type, access: fileObj.access, publicationId: createdPublication.publication_id } })


      //Μόνο αν δεν βρεθεί στην βάση αποθηκεύουμε το αντικείμενο στην βάση
      if (!presentantionFileFound) {
        //Αποθήκευση αντικειμένου ContentFile
        const presentantionFileCreated = await PresentantionFile.create(fileObj);
        //Συσχέτιση Δημοσίευσης με το αρχείο
        await createdPublication.addPresentantionFile(presentantionFileCreated);

        //Αποθήκευση id σε μεταβλητή για να το επιστρέψουμε στο front end
        presentantionFileId = presentantionFileCreated.presentantion_file_id

        if (!fs.existsSync(targetDirectory)) {
          fs.mkdirSync(targetDirectory, { recursive: true });
        }

        fs.renameSync(file.path, targetPath);
      }



    }


    res.status(200).json({
      message: 'Files uploaded succesffully!',
      contentFileId: contentFileId,
      presentantionFileId: presentantionFileId
    })

  } catch (err) {

    console.log(err)

  }






}


exports.get_publications_file = async (req, res, next) => {


  const contentFilesFound = await ContentFile.findAll({ where: { publicationId: req.params.id } })

  const presentantionFilesFound = await PresentantionFile.findAll({ where: { publicationId: req.params.id } })


  let contentFiles;
  if (contentFilesFound) {
    contentFiles = contentFilesFound;
  }

  let presentantionFiles;
  if (presentantionFilesFound) {
    presentantionFiles = presentantionFilesFound;

  }

  res.status(200).json({
    contentFiles: contentFiles,
    presentantionFiles: presentantionFiles
  })



}


exports.download_publication_file = async (req, res, next) => {


  const type = req.body.type;
  const userId = req.userData.userId;

  if (type === 'Content') {

  }

  else if (type === 'Presentantion') {

  }

  else {

  }



}


exports.get_publications_categories = async (req, res, next) => {


  const publicationId = req.params.id;


  console.log("IDDDD", publicationId)
  const publication = await Publication.findByPk(publicationId);

  if (publication) {
    const categories = await publication.getPublicationcategories();
    console.log(categories)

    if (categories) {
      res.status(200).json({
        message: 'Categories Found',
        categories: categories
      })
    }

    else {
      res.status(200).json({
        message: 'No Categories Found'
      })
    }
  }

  else {
    res.status(200).json({
      message: 'No Publication Found'
    })
  }

}


exports.request_file = async (req, res, next) => {

  const requestObj = {
    description: req.body.description,
    file_type: req.body.fileType,
    state: 'pending',
    dismissed: req.body.dismissed
  }


  console.log(requestObj)

  //Θα ψάχνουμε αν υπάρχει request
  //const requestFound = await RequestFile.findOne({where : })


  const requestCreated = await RequestFile.create(requestObj);

  const currentUser = await User.findByPk(req.userData.userId);


  await requestCreated.setUser(currentUser);



  let type = req.body.type;

  if (requestObj.file_type === 'Content') {
    const contendFileFound = await ContentFile.findByPk(req.body.fileId);
    console.log("fileFonud", contendFileFound)
    await requestCreated.setContentFile(contendFileFound);


    //Καθορισμός των stats για τα requests
    const publicationStatsFound = await PublicationStats.findOne({ where: { publicationId: contendFileFound.publicationId } });
    publicationStatsFound.reqs_of_exported_content_file += 1;
    publicationStatsFound.save();

  }

  else if (requestObj.file_type === 'Presentantion') {
    const presentantionFileFound = await PresentantionFile.findByPk(req.body.fileId);
    await requestCreated.setPresentantionFile(presentantionFileFound);


    //Καθορισμός των stats για τα requests
    const publicationStatsFound = await PublicationStats.findOne({ where: { publicationId: presentantionFileFound.publicationId } });
    publicationStatsFound.reqs_of_exported_presentation_file += 1;
    publicationStatsFound.save();
  }

  res.status(200).json({
    message: 'Request send to the user',
    request_id: requestCreated.request_file_id
  })


}


exports.get_user_requests = async (req, res, next) => {



  const user = await User.findByPk(req.userData.userId, {
    include: [
      {
        model: Publication,
        as: 'publications',
      },
    ],
  });


  const publications = await user.publications;




  let contentFiles = [];
  let presentantionFiles = [];

  let requests = [];
  let requestsPresentantionFiles = [];




  if (publications) {

    for (let publication of publications) {


      const contendFileFound = await ContentFile.findOne({
        where: { publicationId: publication.publication_id },
        include: [
          {
            model: RequestFile,
            as: 'contentFileRequests',
          },
        ],
      });

      contentFiles.push(contendFileFound);


      if (contendFileFound.contentFileRequests) {

        contendFileFound.contentFileRequests.map(contentFileRequest => {

          requests.push({
            request_file_id: contentFileRequest.request_file_id,
            file_type: contentFileRequest.file_type,
            state: contentFileRequest.state,
            description: contentFileRequest.description,
            dismissed: contentFileRequest.dismissed,
            createdAt: contentFileRequest.createdAt,
            fileId: contentFileRequest.contentFileId,
            presentantionFileId: contentFileRequest.presentantionFileId,
            userId: contentFileRequest.userId,
          })
        })

      }






      const presentantionFileFound = await PresentantionFile.findOne({
        where: { publicationId: publication.publication_id },
        include: [
          {
            model: RequestFile,
            as: 'presentantionFileRequests',
          },
        ],
      });
      presentantionFiles.push(presentantionFileFound);



      if (presentantionFileFound.presentantionFileRequests) {

        presentantionFileFound.presentantionFileRequests.map(presentantionFileRequest => {

          requests.push({
            request_file_id: presentantionFileRequest.request_file_id,
            file_type: presentantionFileRequest.file_type,
            state: presentantionFileRequest.state,
            dismissed: presentantionFileRequest.dismissed,
            description: presentantionFileRequest.description,
            createdAt: presentantionFileRequest.createdAt,
            contentFileId: presentantionFileRequest.contentFileId,
            presentantionFileId: presentantionFileRequest.presentantionFileId,
            userId: presentantionFileRequest.userId,
          })
        })

      }

    }




    res.status(200).json({
      message: 'Request found',
      requests: requests
    })




  }



}


exports.get_all_requests = async (req, res, next) => {

  let requests = [];


  const contendFilesFound = await ContentFile.findAll({
    include: [
      {
        model: RequestFile,
        as: 'contentFileRequests',
      },
    ],
  });

  if (contendFilesFound) {
    for (let contendFileFound of contendFilesFound) {


      contendFileFound.contentFileRequests.map(contentFileRequest => {

        requests.push({
          request_file_id: contentFileRequest.request_file_id,
          file_type: contentFileRequest.file_type,
          state: contentFileRequest.state,
          description: contentFileRequest.description,
          dismissed: contentFileRequest.dismissed,
          createdAt: contentFileRequest.createdAt,
          fileId: contentFileRequest.contentFileId,
          presentantionFileId: contentFileRequest.presentantionFileId,
          userId: contentFileRequest.userId,
        })
      })

      console.log(contendFileFound)

    }
  }


  const presentantionFilesFound = await PresentantionFile.findAll({
    include: [
      {
        model: RequestFile,
        as: 'presentantionFileRequests',
      },
    ],
  });


  if (presentantionFilesFound) {

    for (let presentantionFileFound of presentantionFilesFound) {
      presentantionFileFound.presentantionFileRequests.map(presentantionFileRequest => {

        requests.push({
          request_file_id: presentantionFileRequest.request_file_id,
          file_type: presentantionFileRequest.file_type,
          state: presentantionFileRequest.state,
          dismissed: presentantionFileRequest.dismissed,
          description: presentantionFileRequest.description,
          createdAt: presentantionFileRequest.createdAt,
          contentFileId: presentantionFileRequest.contentFileId,
          presentantionFileId: presentantionFileRequest.presentantionFileId,
          userId: presentantionFileRequest.userId,
        })
      })
    }

  }



  res.status(200).json({
    message: 'All Requests found',
    requests: requests
  })


}

exports.add_many_publication_title_based = async (req, res, next) => {

  console.log(req.body.length)

  const publicationsToAdd = req.body;

  try {
    if (publicationsToAdd.length > 0) {

      const currentUser = await User.findByPk(req.userData.userId)

      for (let publication of publicationsToAdd) {

        const publicationObj = {
          title: publication.title,
          section: publication.type,
          abstract: publication.abstract,
          isbn: publication.isbn,
          year: publication.year,
          doi: publication.doi
        }

        const createdPublication = await Publication.create(publicationObj)

        //αφού βρούμε τον χρήστη έπειτα συνδέουμε την συγκεκριμένη δημοσίευση με τον τρέχον χρήστη.
        await createdPublication.setUser(currentUser)

        //προσθήκη συγγραφέα
        await createdPublication.addInternalAuthors(currentUser);

        //Εύρεση των κατηγοριών All & Uncategorized του χρήστη
        const allCategoryFound = await Category.findOne({ where: { name: 'All', userId: req.userData.userId, state: 'All' } });
        const uncategorizedFound = await Category.findOne({ where: { name: 'Uncategorized', userId: req.userData.userId, state: 'Uncategorized' } });

        //Προσθήκη Δημοσίευσης σε αυτές τις default κατηγορίες
        createdPublication.addPublicationcategories(allCategoryFound);
        createdPublication.addPublicationcategories(uncategorizedFound);


        //Δημιουργία αντικειμένου για στατιστικά
        const publicationStatsObj = {
          citations: 0,
          references: 0,
          num_of_exported_presentation_file: 0,
          num_of_exported_content_file: 0,
          reqs_of_exported_presentation_file: 0,
          reqs_of_exported_content_file: 0,
        }
        //Αποθήκευση αντικειμένου για στατιστικά στην Βάση
        const publicationStats = await PublicationStats.create(publicationStatsObj);
        //συσχέτιση αντικειμένου publicationStat με την Δημοσίευση που δημιουργήσαμε 
        await createdPublication.setPublicationStat(publicationStats);





        //Αρχικά θα ελέγχουμε το section που έχει η συγκεκριμένη Δημοσίευση που δημιουργούμε
        //Σε περίπτωση που γίνεται προσθήκης Άρθρου
        if (publicationObj.section === 'Article') {
          const article = {
            jurnal: publication.article.jurnal,
            number: publication.article.number,
            volume: publication.article.volume,
            pages: publication.article.pages,
            month: publication.article.month
          }

          console.log(article)
          //εισαγωγή αντικειμένου στον πίνακα Article και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που έχουμε δημιουργήσει
          const article1 = await Article.create(article)
          console.log(article1)

          await createdPublication.setArticle(article1)

        }

        //Σε περίπτωση που γίνεται προσθήκης Book
        else if (publicationObj.section === 'Book') {

          const book = {
            publisher: publication.book.publisher,
            volume: publication.book.volume,
            series: publication.book.series,
            pages: publication.book.pages,
            month: publication.book.month,
            address: publication.book.address,
            version: publication.book.version,

          }

          //εισαγωγή αντικειμένου στον πίνακα Book και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που δημιουργείται αρχικ
          const book1 = await Book.create(book)
          await createdPublication.setBook(book1)
        }

        //Σε περίπτωση που γίνεται προσθήκης Proceedings
        else if (publicationObj.section === 'Proceedings') {

          const proceeding = {
            editor: publication.proceedings.editor,
            series: publication.proceedings.series,
            pages: publication.proceedings.pages,
            month: publication.proceedings.month,
            organization: publication.proceedings.organization,
            address: publication.proceedings.address,
            publisher: publication.proceedings.publisher,

          }

          const proceeding1 = await Proceeding.create(proceeding)
          await createdPublication.setProceeding(proceeding1)



        }


        //Σε περίπτωση που γίνεται προσθήκης Διατριβής
        else if (publicationObj.section === 'Thesis') {
          console.log(publication.section);
          const thesis = {
            school: publication.thesis.school,
            type: publication.thesis.type,
            month: publication.thesis.month,
            address: publication.thesis.address
          }
          console.log(thesis);
          //εισαγωγή αντικειμένου στον πίνακα Book και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που δημιουργείται αρχικά
          const thesis1 = await Thesis.create(thesis);
          await createdPublication.setThesis(thesis1)



        }

        //Σε περίπτωση που γίνεται προσθήκης Κεφάλαιου Βιβλίου
        else if (publicationObj.section === 'Book_Chapter') {

          const book_chapter = {

            chapter: publication.chapterBk.chapter,
            publisher: publication.chapterBk.publisher,
            pages: publication.chapterBk.pages,
            volume: publication.chapterBk.volume,
            series: publication.chapterBk.series,
            type: publication.chapterBk.type,
            month: publication.chapterBk.month,
            address: publication.chapterBk.address,
            version: publication.chapterBk.version,

          }

          console.log(book_chapter)

          //εισαγωγή αντικειμένου στον πίνακα Book και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που δημιουργείται αρχικά
          const book_chapter1 = await ChapterBk.create(book_chapter)
          await createdPublication.setChapterBk(book_chapter1)


        }

        //Σε περίπτωση που γίνεται προσθήκης Τεχνηκής Αναφοράς
        else if (publicationObj.section === 'Tech_Report') {

          const techReport = {
            address: publication.techReport.address,
            month: publication.techReport.month,
            number: publication.techReport.number,
            type: publication.techReport.type,
            tech_report_year: publication.techReport.tech_report_year,
            institution: publication.techReport.institution

          }

          //εισαγωγή αντικειμένου στον πίνακα TechReport και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που δημιουργείται αρχικά
          const techReport1 = await TechReport.create(techReport)
          await createdPublication.setTechReport(techReport1)

        }


        else if (publicationObj.section === 'Other') {

          const other = {
            subType: publication.other.subType,
            grantNumber: publication.other.grantNumber,
            month: publication.other.month,
            pages: publication.other.pages,

          }

          //εισαγωγή αντικειμένου στον πίνακα TechReport και στην συνέχεια δημιουργούμε την συσχέτιση με την Δημοσίευση που δημιουργείται αρχικά
          const other1 = await Other.create(other)
          await createdPublication.setOther(other1)


        }

      }


      res.status(200).json({
        message: 'Publications added successfully!'
      })



    }
  } catch (err) {
    console.log(err)
  }



}