const jwt = require("jsonwebtoken");




module.exports = (req, res, next) => {
    try {

        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, "AcasdDsdfaaxcvSDFsdfsdSDFSDfXCVSDfsdSDfsdsdARWERYUmnmJKGHjhg");

        console.log("decodedToken", decodedToken)

        req.userData = {
            email: decodedToken.email,
            userId: decodedToken.userId,
            userStatus: decodedToken.userStatus,
            userRole: decodedToken.userRole,
        };


        // Check userRole and grant/deny access
        if (req.userData.userRole === "Admin") {

            next();
        } else {

            res.status(403).json({
                message: 'You do not have permission to access this resource.'
            });
        }
    } catch (err) {
        res.status(401).json({
            err: err,
            message: 'You are not authenticated!'
        });
    }
};