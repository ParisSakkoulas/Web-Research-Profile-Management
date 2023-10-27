
const jwt = require("jsonwebtoken");


module.exports = (req, res, next) => {


    try {

        const token = req.headers.authorization.split(" ")[1];

        const decodedToken = jwt.verify(token, "AcasdDsdfaaxcvSDFsdfsdSDFSDfXCVSDfsdSDfsdsdARWERYUmnmJKGHjhg");

        req.userData = { email: decodedToken.email, userId: decodedToken.userId, userStatus: decodedToken.userStatus, userRole: decodedToken.userRole }
        console.log("REQ DATA ", req.userData)

        next();

    } catch (err) {

        res.status(401).json({
            message: 'You are not authenticated!'
        })

    }





}
