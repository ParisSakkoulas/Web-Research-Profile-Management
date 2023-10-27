const multer = require('multer');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Specify the directory where uploaded files will be stored
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Specify the filename for the uploaded file
        cb(null, file.originalname);
    }
});

module.exports = storage;