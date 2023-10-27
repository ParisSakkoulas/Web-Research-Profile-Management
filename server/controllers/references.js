
const Publication = require("../models/Publication/Publication");
const ExternalReference = require("../models/ExternalReference");

const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch("YOURSERPAPIKEY");


exports.add_single_external_reference = async (req, res, next) => {


  const externalRefObj = {
    title: req.body.title,
    year: req.body.year,
    link: req.body.link
  }


  const externlRefCreated = await ExternalReference.create(externalRefObj);

  if (externlRefCreated) {

    res.status(200).json({
      message: 'External Reference added successfully!',
      externlRefCreated: externlRefCreated
    })

  }



}

exports.add_single_reference_to_publication = async (req, res, next) => {


  const publication = await Publication.findByPk(req.params.publicationId);

  console.log(publication);

  const externalReference = {

    title: req.body.title,
    year: req.body.year,
    link: req.body.link
  }


  if (externalReference.title && externalReference.year && externalReference.link)
    ExternalReference.findOrCreate({ where: { title: externalReference.title, year: externalReference.year, link: externalReference.link } }).then(exRefsFound => {

      publication.addExreference(exRefsFound[0]);

    });


  else if (externalReference.title && externalReference.year) {
    ExternalReference.findOrCreate({ where: { title: externalReference.title, year: externalReference.year } }).then(exRefsFound => {

      publication.addExreference(exRefsFound[0]);

    });
  }

  else {
    ExternalReference.findOrCreate({ where: { title: externalReference.title } }).then(exRefsFound => {

      publication.addExreference(exRefsFound[0]);

    });
  }

  res.status(200).json({
    message: 'Reference added successfully!'
  })


}


exports.add_multiple_refernces_to_publication = async (req, res, next) => {


  const publication = await Publication.findByPk(req.params.publicationId);

  const exRefs = req.body;


  for (let i in exRefs) {




    if (exRefs[i].title && exRefs[i].year && exRefs[i].link)
      ExternalReference.findOrCreate({ where: { title: exRefs[i].title, year: exRefs[i].year, link: exRefs[i].link } }).then(async exRefsFound => {

        publication.addExreference(exRefsFound[0]);
        const publicationStat = await publication.getPublicationStat();
        await publicationStat.increment('references', { by: 1 });


      });


    else if (exRefs[i].title && exRefs[i].year) {
      ExternalReference.findOrCreate({ where: { title: exRefs[i].title, year: exRefs[i].year } }).then(async exRefsFound => {

        publication.addExreference(exRefsFound[0]);
        const publicationStat = await publication.getPublicationStat();
        await publicationStat.increment('references', { by: 1 });


      });
    }

    else {
      ExternalReference.findOrCreate({ where: { title: exRefs[i].title } }).then(async exRefsFound => {

        publication.addExreference(exRefsFound[0]);
        const publicationStat = await publication.getPublicationStat();
        await publicationStat.increment('references', { by: 1 });

      });
    }

  }

  res.status(200).json({
    message: 'External References Added successfully'
  })




}


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
    return [...$("*")]
      .flatMap(e =>
        [...$(e).contents()].filter(e => e.type === "text")
      )
      .map(e => $(e).text().trim())
      .filter(Boolean)
      .find(e => normalizeText(e).startsWith(normalizedTitle));
  }
  catch (err) {
    return title;
  }
}

exports.get_references = async (req, res, next) => {



  const querySearches = req.body;
  let externalRefs = [];


  for (let querySearch of querySearches) {
    console.log(querySearch)

    const query = querySearch;


    const params = {
      engine: "google_scholar",
      q: query
    }


    console.log(params)

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

          //Αν το μέγεθος του πίνακα είναι μεγαλύτερο του 1 τότε σημαίνει ότι θα σταλούν όλες οι δημοσιεύσεις που βρέθηκαν σύμφωνα με το αντίστοιχο query
          if (publicationsFromScholarSearch.length > 1) {
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


              //Αν είναι μεγαλύτερο του 1 τότε απλώς επιστρέφουμε τα αποτελέσματα
              if (publicationsFromDblpSearch.length > 1) {
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
      for (let publication of publications) {
        externalRefs.push(publication)
      }
    }




  }

  console.log(externalRefs.length)

  res.status(201).json({
    refs: externalRefs
  })

}