const ContentFile = require("../models/Files/ContentFile")
const PresentantionFile = require("../models/Files/PresentantionFile")
const RequestFile = require("../models/Files/RequestFile")
const Notification = require("../models/Notification")
const Publication = require("../models/Publication/Publication")
const User = require("../models/User")

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const path = require('path');
const fs = require('fs');
const os = require('os');
const PublicationStats = require("../models/Publication/PublicationStats")

// Δημιουργία transporter αντικειμένου που θα χρησιμοποιήσουμε για την αποστολή του verification code στο email χρήστη
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'academicnetsp@gmail.com',
        pass: 'gleuzdlkvqwsiqgr'
    }
});


exports.get_my_request_as_creator = async (req, res, next) => {



    const createdRequests = await RequestFile.findAll({
        where: { userId: req.userData.userId },
        include: [
            { model: ContentFile, as: 'contentFile' },
            { model: PresentantionFile, as: 'presentantionFile' }
        ]
    });

    if (createdRequests) {
        res.status(200).json({
            message: 'Requests found',
            requests: createdRequests
        })
    }

}



exports.get_my_request_as_receiver = async (req, res, next) => {


    const user = await User.findByPk(req.userData.userId, {
        include: [
            {
                model: Publication,
                as: 'publications',
            },
        ],
    });





    if (user) {
        const publications = await user.publications;

        let contentFiles = [];
        let presentantionFiles = [];

        let requests = [];
        let requestsPresentantionFiles = [];




        if (publications) {


            const requestsPromises = [];


            for (let publication of publications) {

                const contentFilePromise = await ContentFile.findOne({
                    where: { publicationId: publication.publication_id },
                    include: [
                        {
                            model: RequestFile,
                            as: 'contentFileRequests',
                        },
                    ],
                });

                const presentationFilePromise = await PresentantionFile.findOne({
                    where: { publicationId: publication.publication_id },
                    include: [
                        {
                            model: RequestFile,
                            as: 'presentantionFileRequests',
                        },
                    ],
                });


                const [contentFileFound, presentantionFileFound] = await Promise.all([
                    contentFilePromise,
                    presentationFilePromise,
                ]);

                console.log(contentFilePromise)




                if (contentFileFound) {
                    if (contentFileFound.contentFileRequests) {
                        const contentFileRequestsPromises = contentFileFound.contentFileRequests.map(async contentFileRequest => {
                            const user = await User.findByPk(contentFileRequest.userId, {
                                attributes: ['firstName', 'lastName', 'userName', 'email', 'user_id'],
                            });

                            return {
                                request_file_id: contentFileRequest.request_file_id,
                                file_type: contentFileRequest.file_type,
                                state: contentFileRequest.state,
                                description: contentFileRequest.description,
                                dismissed: contentFileRequest.dismissed,
                                createdAt: contentFileRequest.createdAt,
                                fileId: contentFileRequest.contentFileId,
                                presentantionFileId: contentFileRequest.presentantionFileId,
                                fileName: contentFileFound.filename,
                                user: user
                            };
                        });

                        requestsPromises.push(...contentFileRequestsPromises);
                    }
                }


                if (presentantionFileFound) {
                    if (presentantionFileFound.presentantionFileRequests) {
                        const presentationFileRequestsPromises = presentantionFileFound.presentantionFileRequests.map(
                            async presentantionFileRequest => {
                                const user = await User.findByPk(presentantionFileRequest.userId, {
                                    attributes: ['firstName', 'lastName', 'userName', 'email', 'user_id'],
                                });

                                return {
                                    request_file_id: presentantionFileRequest.request_file_id,
                                    file_type: presentantionFileRequest.file_type,
                                    state: presentantionFileRequest.state,
                                    dismissed: presentantionFileRequest.dismissed,
                                    description: presentantionFileRequest.description,
                                    createdAt: presentantionFileRequest.createdAt,
                                    contentFileId: presentantionFileRequest.contentFileId,
                                    presentantionFileId: presentantionFileRequest.presentantionFileId,
                                    fileName: presentantionFileFound.filename,

                                    user: user
                                };
                            }
                        );

                        requestsPromises.push(...presentationFileRequestsPromises);
                    }
                }


                Promise.all(requestsPromises)
                    .then(requests => {
                        res.status(200).json({
                            message: 'Request found',
                            requests: requests,
                        });
                    })
                    .catch(error => {

                    });




            }




        }

    }



}


exports.delete_request = async (req, res, next) => {



    const currentRequest = await RequestFile.findByPk(req.params.requestId);


    currentRequest.destroy().then(async num => {

        console.log(num)

        if (num) {

            res.status(201).json({
                message: "Request Deleted!"
            })
        }

        else {
            res.status(201).json({
                message: "Request was not found"
            })
        }


    })




}


exports.decline_request = async (req, res, next) => {



    const requestFound = await RequestFile.findByPk(req.params.requestId);

    if (requestFound) {

        requestFound.state = 'declined';
        await requestFound.save();

        let file;
        if (requestFound.file_type === 'Content') {

            file = await ContentFile.findByPk(requestFound.contentFileId);

        }
        else if (requestFound.file_type === 'Presentantion') {
            file = await PresentantionFile.findByPk(requestFound.presentantionFileId);
        }

        const notificationForUserCreatorOfRequest = await Notification.create({
            type: 'Decline Request',
            title: 'Request Declined for ' + file.filename,
            status: 'Unread',
            userToNotify: requestFound.userId,
            userCreator: req.userData.userId
        })


        res.status(200).json({
            message: 'Request Declined'
        })


    }


}



exports.accept_request = async (req, res, next) => {


    const requestFileFound = await RequestFile.findByPk(req.params.requestId);

    const currentUserToSend = await User.findByPk(requestFileFound.userId);




    if (requestFileFound) {



        requestFileFound.state = 'accepted';
        requestFileFound.save();

        // Δημιουργία αντικειμένου token που θα στείλουμε στον χρήστη για να κατεβάσει το αρχείο
        const token = jwt.sign({
            data: 'Data token'
        },
            'ourSecretKey',

            { expiresIn: '30m' }

        )


        // Δημιουργία αντικειμένου mailOptions που θα έχει τα στοιχεία που στέλνουμε το mail
        let mailOptions;


        if (requestFileFound.file_type === 'Content') {

            const contentFileFound = await ContentFile.findByPk(requestFileFound.contentFileId);

            console.log(contentFileFound);



            const notificationForUserCreatorOfRequest = await Notification.create({
                type: 'Accept Request',
                title: 'Request Accepted for ' + contentFileFound.filename,
                status: 'Unread',
                userToNotify: requestFileFound.userId,
                userCreator: req.userData.userId
            })


            // Δημιουργία αντικειμένου mailOptions που θα έχει τα στοιχεία που στέλνουμε το mail
            mailOptions = {
                from: 'academicnetsp@gmail.com',
                to: currentUserToSend.email, // email χρήστη
                subject: `${requestFileFound.file_type} download`,
                html: `Press <a href=https://localhost:3000/requests/download/${requestFileFound.request_file_id}/${token}> here </a> to download!`
            };



        }

        else if (requestFileFound.file_type === 'Presentantion') {


            const presentantionFileFound = await PresentantionFile.findByPk(requestFileFound.presentantionFileId);

            const notificationForUserCreatorOfRequest = await Notification.create({
                type: 'Accept Request',
                title: 'Request Accepted for ' + presentantionFileFound.filename,
                status: 'Unread',
                userToNotify: requestFileFound.userId,
                userCreator: req.userData.userId
            })

            // Δημιουργία αντικειμένου mailOptions που θα έχει τα στοιχεία που στέλνουμε το mail
            mailOptions = {
                from: 'academicnetsp@gmail.com',
                to: currentUserToSend.email, // email χρήστη
                subject: `${requestFileFound.file_type} download`,
                html: `Press <a href=http://localhost:3000/requests/download/${requestFileFound.request_file_id}/${token}> here </a> to download!`
            };

        }



        // send mail with defined transport object
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {

            } else {
                console.log('Message sent: %s', info.messageId);


            }
        });


        return res.status(200).json({
            message: `A confirmation mail has sent to ${currentUserToSend.email}. Check your email!`,
            user: currentUserToSend,
        })

    }

}


exports.download_file = async (req, res, next) => {

    const requestFileId = req.params.requestFileId;
    const token = req.params.token;



    console.log("Download started")



    //Verify token
    jwt.verify(token, 'ourSecretKey', async (err, decodedToken) => {


        //Αν υπάρξει κάποιο λάθος με το λινκ ή το duration του code έχει λήξει
        if (err) {
            res.status(400).json({
                messate: "Download failed, possibly the link is invalid or expired. You can choose to send a new request to the user!"
            });
        }


        else {



            const requestFileFound = await RequestFile.findByPk(requestFileId);


            if (requestFileFound) {



                if (requestFileFound.file_type === 'Presentantion') {

                    const presentantion_file_id = requestFileFound.presentantionFileId;


                    const presentantionFileFound = await PresentantionFile.findByPk(presentantion_file_id);
                    const filename = presentantionFileFound.filename;


                    //Καθορισμός των stats για τα requests
                    const publicationStatsFound = await PublicationStats.findOne({ where: { publicationId: presentantionFileFound.publicationId } });
                    publicationStatsFound.num_of_exported_presentation_file += 1;
                    publicationStatsFound.save();

                    if (presentantionFileFound) {

                        //παίρνουμε το user id

                        const publicationFound = await Publication.findOne({ where: { publication_id: presentantionFileFound.publicationId } })


                        let userId;
                        if (publicationFound) {
                            console.log("pubFound", publicationFound)
                            userId = publicationFound.userId
                        }


                        const accessForContentFile = presentantionFileFound.access;
                        const fileName = presentantionFileFound.filename;
                        const targetDirectory = `./uploads/${userId}/${presentantionFileFound.publicationId}/${accessForContentFile}`;
                        const targetPath = `${targetDirectory}/${fileName}`;

                        const type = path.extname(fileName)
                        console.log(targetPath)
                        if (fs.existsSync(targetPath)) {

                            let contentType;

                            // Determine the content type based on the file extension
                            const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
                            switch (fileExtension) {
                                case 'ppt':
                                    contentType = 'application/vnd.ms-powerpoint';
                                    break;
                                case 'pptx':
                                    contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                                    break;
                                // Add more cases for other file extensions and corresponding content types if needed
                                default:
                                    contentType = 'application/octet-stream'; // Default content type if the file extension is not recognized
                            }


                            res.setHeader('Content-Type', `application/${type}`);
                            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
                            res.sendFile(path.resolve(targetPath));
                        }

                    }



                }
                else if (requestFileFound.file_type === 'Content') {


                    const contentFileFound = await ContentFile.findByPk(requestFileFound.contentFileId);
                    const publicationFound = await Publication.findOne({ where: { publication_id: contentFileFound.publicationId } })

                    let userId;
                    if (publicationFound) {
                        console.log("pubFound", publicationFound)
                        userId = publicationFound.userId
                    }

                    //Καθορισμός των stats για τα requests
                    const publicationStatsFound = await PublicationStats.findOne({ where: { publicationId: contentFileFound.publicationId } });
                    publicationStatsFound.num_of_exported_content_file += 1;
                    publicationStatsFound.save();


                    const accessForContentFile = contentFileFound.access;
                    const fileName = contentFileFound.filename;
                    const targetDirectory = `./uploads/${userId}/${contentFileFound.publicationId}/${accessForContentFile}`;
                    const targetPath = `${targetDirectory}/${fileName}`;

                    const type = path.extname(fileName)

                    console.log(targetPath)
                    if (fs.existsSync(targetPath)) {

                        res.setHeader('Content-Type', `application/${type}`);
                        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
                        res.sendFile(path.resolve(targetPath));
                    }



                }

            }


            else {
                res.status(404).json({
                    message: 'Could not find file'
                })
            }



        }


    })

}