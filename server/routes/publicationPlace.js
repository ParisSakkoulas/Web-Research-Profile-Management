const checkAuth = require("../middleware/checkAuth");

const publicationPlacesController = require("../controllers/publicationPlace")


const express = require("express");

const router = express.Router();


router.post("/addPublicationPlace", checkAuth, publicationPlacesController.add_new_publication_place);

router.get("/allPublicationPlaces", checkAuth, publicationPlacesController.get_all_publication_places);

router.get("/singlePublicationPlace/:id", checkAuth, publicationPlacesController.get_single_publication_place);

router.post("/getLivePublicationPlaces", checkAuth, publicationPlacesController.get_live_publication_places);

router.put("/:id", checkAuth, publicationPlacesController.upldate_single_publication_place);

router.delete("/deleteManyPublicationPlaces", checkAuth, publicationPlacesController.delete_many_publication_places);

router.delete("/deletePublicationPlace/:id", checkAuth, publicationPlacesController.delete_single_publication_place);



module.exports = router;