


const usersController = require("../controllers/users");

const checkAuth = require("../middleware/checkAuth");
const checkToken = require("../middleware/checkToken");
const express = require("express");

const router = express.Router();
const multer = require('multer');
const storage = require('../config/config.multer');
const checkAdmin = require("../middleware/checkAdmin");
const upload = multer({ storage: storage });

//user routes
router.post("/signup", usersController.register_new_user);
router.post("/login", usersController.log_in_user);
router.get("/verify/:confirmationCode", usersController.verify_user);
router.post("/resendVerificationCode", usersController.resend_verification_code);
router.delete("/deleteUser/:userId", checkAuth, usersController.delete_user);
router.post("/checkPassword", checkAuth, usersController.check_users_password);
router.post("/changePassword", checkAuth, usersController.change_user_password);
router.post("/changeEmail", checkAuth, usersController.change_user_email);
router.post("/resetPassword", usersController.reset_user_password);
router.post("/resendToken", usersController.resend_token);




//User info
router.put("/updateUserInfo", checkAuth, usersController.update_profile_user_info);
router.post("/getLiveUserNames", usersController.get_live_userName);
router.post("/getLiveEmails", usersController.get_live_emails);



//Organization
router.get("/AllOrganizations", checkAuth, usersController.get_all_organizations);
router.post("/addNewOrganization", checkAuth, usersController.add_new_organization);
router.put("/updateOrganization/:id", checkAuth, usersController.update_organization);
router.delete("/delteOrganization/:id", checkAuth, usersController.delete_organization);


//Jobs
router.get("/allJobs", checkAuth, usersController.get_all_jobs);
router.post("/addNewJob", checkAuth, usersController.add_new_job);
router.put("/updateJob/:id", checkAuth, usersController.update_job);
router.delete("/deleteJob/:id", checkAuth, usersController.delete_job);


//Studies
router.get("/allStudies", checkAuth, usersController.get_all_studies);
router.post("/addNewStudy", checkAuth, usersController.add_new_study);
router.put("/updateStudy/:id", checkAuth, usersController.update_study);
router.delete("/deleteStudy/:id", checkAuth, usersController.delete_study);

///Abilities
router.get("/allAbilities", checkAuth, usersController.get_all_abilities);
router.post("/addAbilities", checkAuth, usersController.update_abilities);

//Interests
router.get("/allInteresst", checkAuth, usersController.get_all_interests);
router.post("/addInterests", checkAuth, usersController.update_interests);

//Photo profile
router.post("/uploadPhotoProfile", checkAuth, upload.single('file'), usersController.upload_photo_profile);

//Profile stats
router.get("/profileStats", checkAuth, usersController.get_profile_stats);

router.get("/singleProfileStats/:userId", checkAuth, usersController.get_single_profile_stats);

router.get("/user-profile/:id", usersController.get_user_profile);

router.get("/user-photo/:id", usersController.get_user_photo);

router.get("/userPublications/:id", usersController.get_user_publications);


router.delete("/removePhotoProfile", checkAuth, usersController.remove_photo_profile);

router.get("/getUserData", checkAuth, usersController.get_user_meta_data);

router.get("/checkUsername/:userName", usersController.check_user_name);

router.get("/checkEmail/:email", usersController.check_email);

router.get("/userDataProfile", checkAuth, usersController.get_user_data_profile);

router.post("/getLiveUsers", checkAuth, usersController.get_live_users);

router.post("/getLiveExternalAuthors", checkAuth, usersController.get_live_external_authors);

router.get("/getPhotoProfile", checkAuth, usersController.get_profile_photo)

router.post("/addExternalAuthor", checkAuth, usersController.add_external_author);


router.post("/getSimpleUsers", usersController.get_simple_live_users);

//followings-followers
router.post("/followUser/:userIdTofollow", checkAuth, usersController.follow_user);
router.put("/unfollowUser/:userIdToUnfollow", checkAuth, usersController.unfollow_user);
router.get("/followers/:userId", usersController.get_user_followers);
router.get("/following/:userId", usersController.get_user_followings);
router.get("/publicationsFromFollowings", checkAuth, usersController.get_publications_from_followings);

//endorse
router.post("/endorseUser/:userId", checkAuth, usersController.endorse_user);
router.get("/endorsements/:userId", usersController.get_user_endorsements);
router.delete("/endorsement/:endorsementId", usersController.delete_endorsement);

//rating
router.post("/rateSingleUser/:userId", checkAuth, usersController.rate_single_user);
router.get("/singleRating/:userId", usersController.get_single_user_rating);
router.get("/singleRatingOfCurrentUserCreator/:userId", checkAuth, usersController.get_current_user_and_profile_rating);






router.post("/getShopisticatedUsers", usersController.get_shopisticated_internal_users_result);



router.get("/userNetwork/:userId", usersController.get_network_user);



//Admin routes

router.get("/allUsers", checkAuth, checkAdmin, usersController.get_all_users);
router.put("/verifyUser/:id", checkAuth, checkAdmin, usersController.verify_single_user);
router.put("/inactivateUser/:id", checkAuth, checkAdmin, usersController.inactivate_single_user);
router.put("/changeUserInfo/:id", checkAuth, checkAdmin, usersController.change_user_info);
router.post("/adminAddOrganization/:id", checkAuth, checkAdmin, usersController.add_admin_organization);
router.delete("/deleteOrganization/:id", checkAuth, checkAdmin, usersController.delete_user_organization);
router.put("/updateOrganization/:id", checkAuth, checkAdmin, usersController.update_user_organization);
router.post("/addNewJob/:id", checkAuth, checkAdmin, usersController.add_new_admin_job);
router.delete("/deleteJob/:id", checkAuth, checkAdmin, usersController.delete_user_admin_job);
router.put("/updateJob/:id", checkAuth, checkAdmin, usersController.update_user_admin_job);
router.post("/addNewStudy/:id", checkAuth, checkAdmin, usersController.add_new_admin_study);

router.post("/addAbilities/:id", checkAuth, checkAdmin, usersController.add_new_admin_abilities);
router.post("/addInterests/:id", checkAuth, checkAdmin, usersController.add_new_admin_interests);
router.post("/changeEmail/:id", checkAuth, checkAdmin, usersController.change_admin_user_email);

router.get("/allRequests", checkAuth, checkAdmin, usersController.get_all_requests);
router.get("/allNotifications", checkAuth, checkAdmin, usersController.get_all_notifications);




module.exports = router;
