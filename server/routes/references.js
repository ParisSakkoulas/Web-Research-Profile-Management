const referencesController = require("../controllers/references")

const express = require("express");

const router = express.Router();


router.post("/addExternalReference", referencesController.add_single_external_reference);

router.post("/addExternalReference/:publicationId", referencesController.add_single_reference_to_publication);

router.post("/addMultipleExternalReferences/:publicationId", referencesController.add_multiple_refernces_to_publication);

router.post("/getReferences", referencesController.get_references);

module.exports = router;


