const categoryController = require("../controllers/categories")

const checkAuth = require("../middleware/checkAuth")

const express = require("express");

const router = express.Router();


router.post("/addCategory", checkAuth, categoryController.add_new_category);

router.get("/allMyCategories", checkAuth, categoryController.get_all_my_categories);

router.get("/singleCategory/:id", checkAuth, categoryController.get_single_category);

router.delete("/deleteSingle/:id", checkAuth, categoryController.delete_single_category);

router.delete("/deleteMany", checkAuth, categoryController.delete_many_categories);

router.delete("/deletePublicationsCategory/:id", checkAuth, categoryController.delete_publications_category);

router.put("/:id", checkAuth, categoryController.update_category);
/*
router.post("/addSinglePublicationToCategory", checkAuth, categoryController);

router.post("/addManyPublicationToCategory", checkAuth, categoryController);

router.post("/transferSinglePublicationToCategory", checkAuth, categoryController);

router.post("/transferManyPublicationsToCategory", checkAuth, categoryController);


*/




module.exports = router;
