
const contentControllers = require("../controllers/presentantionFiles")

const checkAuth = require("../middleware/checkAuth")
const multer = require('multer');

const express = require("express");
const storage = require('../config/config.multer');

const router = express.Router();
const upload = multer({ storage: storage });


router.delete("/singlePresentantionFile/:id", checkAuth, contentControllers.remove_single_presentantion_file);

router.post("/replacePresentantionFile/:id", checkAuth, upload.fields([{ name: 'presentantionFile', maxCount: 1 }]), contentControllers.replace_single_presentantion_file);

router.post("/downloadPresentantionFile", checkAuth, contentControllers.download_single_presentantion_file);



module.exports = router;
