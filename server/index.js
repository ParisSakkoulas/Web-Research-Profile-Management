const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const https = require("https");
const fs = require('fs');
const csrfDSC = require('express-csrf-double-submit-cookie')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const crypto = require('crypto');





const options = {
  key: fs.readFileSync('../keys/localhost.key'),
  cert: fs.readFileSync('../keys/localhost.crt'),
};

const db = require("./config/db.config");

const app = express();

//Ενεργοποίηση CSRF προστασίας

//const csrfProtection = csrfDSC();



//Επιλογή της πόρτας
const port = process.env.PORT || 3000;


//σύνδεση με την βάση
db.authenticate().then(con => {
  console.log('Connection has been established successfully.')
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});


//Δημιουργία του server να ακούει σε συγκεκριμένη πόρτα
const server = https.createServer(options, app);
server.listen(port);

app.use(bodyParser.json());
app.use(cors({
  origin: 'https://localhost:4200',
  credentials: true,
}));
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*", "https://localhost:4200");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, XSRF-TOKEN"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

//app.use(csrfProtection)
app.use(cookieParser());



/*
app.get("/", csrfProtection, (req, res) => {


    const cookieHeader = req.headers.cookie;

    console.log(req.cookies._csrf_token)


    function getCookieValue(cookieString, cookieName) {
        const cookies = cookieString.split('; ');
        for (const cookie of cookies) {
            const [name, value] = cookie.split('=');
            if (name === cookieName) {
                return value;
            }
        }
        return null;
    }


    const csrfToken = getCookieValue(cookieHeader, '_csrf_token');

    if (csrfToken) {
        res.cookie(csrfToken);
        res.status(200).json({});
    } else {
        res.status(400).json({ error: "CSRF token not found in cookies" });
    }
});
*/


app.use((req, res, next) => {
  let csrfToken = crypto.randomBytes(12).toString('hex');
  req.csrfToken = csrfToken;
  res.cookie('XSRF-TOKEN', csrfToken, { httpOnly: false, path: '/' });
  next();
});




const publicationRoutes = require("./routes/publications");
app.use("/publications", publicationRoutes);

const referenceRoutes = require("./routes/references");
app.use("/references", referenceRoutes);

const tagRoutes = require("./routes/tags");
app.use("/tags", tagRoutes);

const userRoutes = require("./routes/user");
app.use("/users", userRoutes);

const categorieRoutes = require("./routes/categories");
app.use("/categories", categorieRoutes);

const contentFileRoutes = require("./routes/contentFiles");
app.use("/contentFiles", contentFileRoutes);

const presentantionFileRoutes = require("./routes/presentantionFiles");
app.use("/presentantionFiles", presentantionFileRoutes);

const publicationPlaceRoutes = require("./routes/publicationPlace");
app.use("/publicationPlaces", publicationPlaceRoutes);

const notificationRoutes = require("./routes/notifications");
app.use("/notifications", notificationRoutes);

const requestFileRoutes = require("./routes/requests");
app.use("/requests", requestFileRoutes);


