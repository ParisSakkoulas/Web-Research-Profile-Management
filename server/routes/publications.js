


const publicationsController = require("../controllers/publications")

const checkAuth = require("../middleware/checkAuth")
const multer = require('multer');

const express = require("express");
const storage = require('../config/config.multer');

const router = express.Router();
const upload = multer({ storage: storage });


router.post("/addPublication", checkAuth, upload.fields([
    { name: 'contentFile', maxCount: 1 },
    { name: 'presentantionFile', maxCount: 1 }
]), publicationsController.add_single_publication);

router.get("/allPublications", publicationsController.get_all_publications);

router.get("/allMyPublications", checkAuth, publicationsController.get_all_my_publications);

router.get("/singlePublication/:publicationId", publicationsController.get_single_publication);

router.post("/searchSinglePublication", checkAuth, publicationsController.search_single_publication_based_on_identifier);

router.post("/getLiveExternalPublications", checkAuth, publicationsController.get_live_external_publications);

router.post("/getLiveInternalPublications", publicationsController.get_live_internal_publications);

router.post("/liveSimpleSearchPublications", publicationsController.get_simple_internal_live_publications);

router.post("/shopisticatedSearch", publicationsController.get_shopisticated_internal_publications_result);

router.post("/addMultiplePublication", checkAuth, publicationsController.add_multiple_external_publications);

router.post("/addMultiplePublicationBasedOnISBN", checkAuth, publicationsController.add_multiple_publications_isbn_based);

router.post("/searchPublicationsBasedOnAuthor", checkAuth, publicationsController.search_publications_of_author);

router.post("/addPublicationsBasedOnAuthorId", checkAuth, publicationsController.add_publications_based_on_author_id);

router.post("/addPublicationToCategory", checkAuth, publicationsController.add_publication_to_category);

router.post("/addManyPublicationsToCategory", checkAuth, publicationsController.add_many_publications_to_category);

router.post("/uploadDescriptionFile", checkAuth, upload.single('file'), publicationsController.add_description_file);

router.post("/uploadPublicationFile/:id", checkAuth, upload.fields([
    { name: 'contentFile', maxCount: 1 },
    { name: 'presentantionFile', maxCount: 1 }
]), publicationsController.upload_publication_file);

router.get("/publicationFiles/:id", publicationsController.get_publications_file);

router.get("/downloadPublicatioFile/:id", checkAuth, publicationsController.download_publication_file);

router.get("/publicationsCategories/:id", publicationsController.get_publications_categories)

router.post("/movePublicationToCategory", checkAuth, publicationsController.change_publication_to_another_category);

router.post("/exportSinglePublicaiton", checkAuth, publicationsController.export_single_publication_file);

router.post("/exportMultiplePublications", checkAuth, publicationsController.export_multiple_publications_file);

router.post("/exportsPublicationsCategory", checkAuth, publicationsController.export_publications_category);

router.post("/requestFile", checkAuth, publicationsController.request_file);

router.get("/requestFiles", checkAuth, publicationsController.get_user_requests);

router.get("/allRequestFiles", checkAuth, publicationsController.get_all_requests);


router.delete("/removePublicationFromCategory", checkAuth, publicationsController.remove_publication_from_category);

router.put("/:publicationId", checkAuth, publicationsController.update_single_publication);

router.delete("/singlePublication/:publicationId", checkAuth, publicationsController.delete_single_publication);

router.delete("/deleteManyPublications", checkAuth, publicationsController.delet_many_publications);

router.delete("/allPublications", checkAuth, publicationsController.delete_all_publications);


router.post("/addManyPublicationsTitleBased", checkAuth, publicationsController.add_many_publication_title_based);


module.exports = router;
