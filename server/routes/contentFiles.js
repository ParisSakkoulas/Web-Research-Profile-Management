
const contentControllers = require("../controllers/contentFiles")

const checkAuth = require("../middleware/checkAuth")
const multer = require('multer');

const express = require("express");
const storage = require('../config/config.multer');

const router = express.Router();
const upload = multer({ storage: storage });


router.delete("/singleContentFile/:id", checkAuth, contentControllers.remove_single_content_file);


router.post("/replaceConentFile/:id", checkAuth, upload.fields([{ name: 'contentFile', maxCount: 1 }]), contentControllers.replace_single_content_file);

router.post("/downloadContentFile", checkAuth, contentControllers.download_single_content_file);


module.exports = router;
