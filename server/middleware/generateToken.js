
const crypto = require('crypto');

module.exports = (req, res, next) => {
    let csrfToken = crypto.randomBytes(12).toString('hex');
    req.csrfToken = csrfToken;
    res.cookie('XSRF-TOKEN', csrfToken, { httpOnly: true });
    next();
};