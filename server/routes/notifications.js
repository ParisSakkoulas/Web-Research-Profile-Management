

const checkAuth = require("../middleware/checkAuth");

const notificationsControllers = require("../controllers/notifications");

const express = require("express");

const router = express.Router();


router.get("/allNotifications", checkAuth, notificationsControllers.get_all_notifications);

router.get("/singleNotfication/:notificationId", checkAuth, notificationsControllers.get_single_notification);

router.put('/setSingleNotificationAsRead/:notificationId', checkAuth, notificationsControllers.set_notification_as_read);

router.post("/createNewNotification", checkAuth, notificationsControllers.add_new_notification);


router.delete("/:notificationId", checkAuth, notificationsControllers.delete_notification);




module.exports = router;