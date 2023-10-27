

const checkAuth = require("../middleware/checkAuth");

const requestControllers = require("../controllers/requestFile")

const express = require("express");

const router = express.Router();



router.delete("/:requestId", checkAuth, requestControllers.delete_request);

router.put("/decline/:requestId", checkAuth, requestControllers.decline_request);

router.post("/accept/:requestId", checkAuth, requestControllers.accept_request);

router.get("/myRequestsAsCreator", checkAuth, requestControllers.get_my_request_as_creator);

router.get("/myRequestsAsReceiver", checkAuth, requestControllers.get_my_request_as_receiver);

router.get("/download/:requestFileId/:token", requestControllers.download_file);


module.exports = router;