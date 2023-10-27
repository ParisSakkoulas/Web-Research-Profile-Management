
const tagsController = require("../controllers/tags");

const express = require("express");

const router = express.Router();


router.get("/allTags", tagsController.get_all_tags);

module.exports = router;
