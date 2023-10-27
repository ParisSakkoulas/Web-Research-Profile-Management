const ContentFile = require("../models/Files/ContentFile");
const PresentantionFile = require("../models/Files/PresentantionFile");
const fs = require('fs');
const fsExtra = require('fs-extra');

const path = require('path');

const { Sequelize, Op } = require('sequelize');
const Publication = require("../models/Publication/Publication");


Sequelize.Op = Op;
const operatorsAliases = {
    $like: Op.like,
    $not: Op.not
}


exports.remove_single_presentantion_file = async (req, res, next) => {



    const presentantionFileFound = await PresentantionFile.findByPk(req.params.id);

    console.log(presentantionFileFound)

    if (presentantionFileFound) {



        //παίρνουμε το user id
        const userId = req.userData.userId;
        const accessForContentFile = presentantionFileFound.access;
        const fileName = presentantionFileFound.filename;
        const targetDirectory = `./uploads/${userId}/${presentantionFileFound.publicationId}/${accessForContentFile}`;
        const targetPath = `${targetDirectory}/${fileName}`;

        //Διαγραφή αρχείου
        if (fs.existsSync(targetDirectory)) {

            fsExtra.remove(targetPath, (err) => {
                if (err) {
                    console.error('Error occurred in deleting directory', err);
                } else {
                    console.log('Directory deleted successfully');
                }
            });
        }




        await presentantionFileFound.destroy();

        res.status(200).json({
            message: 'Presentanion File Removed Successfully!'
        })
    }

    else {
        res.status(200).json({
            message: 'Could not find this file'
        })
    }


}


exports.replace_single_presentantion_file = async (req, res, next) => {


    const presentantionFileFound = await PresentantionFile.findByPk(req.params.id);

    console.log(req.params.id)



    if (req.files['presentantionFile']) {

        if (presentantionFileFound) {

            //παίρνουμε το user id
            const userId = req.userData.userId;
            const accessForContentFile = req.body.presentantionFileAccess;
            const presentantionFile = req.files['presentantionFile'];
            const folderPath = './uploads/' + userId;
            const fileName = presentantionFile.originalname;
            const filePath = folderPath + '/' + fileName;
            const file = req.files['presentantionFile'][0];
            const targetDirectory = `./uploads/${userId}/${presentantionFileFound.publicationId}/${accessForContentFile}`;
            const targetPath = `${targetDirectory}/${file.originalname}`;

            //Δημιουργία νέου φακέλου και αρχείου 
            if (!fs.existsSync(targetDirectory)) {
                fs.mkdirSync(targetDirectory, { recursive: true });
            }
            fs.renameSync(file.path, targetPath);

            const oldFilePath = `${targetDirectory}/${presentantionFileFound.filename}`;

            console.log(oldFilePath)
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath)
            }



            //Αλλαγή τιμών στη βάση για το contendFile
            presentantionFileFound.filename = req.files['presentantionFile'][0].filename;
            presentantionFileFound.type = path.extname(req.files['presentantionFile'][0].filename);
            presentantionFileFound.access = req.body.presentantionFileAccess;
            await presentantionFileFound.save();




            res.status(200).json({
                message: 'File updated successfully',
                newPath: targetPath,
                type: path.extname(req.files['presentantionFile'][0].filename)
            })
        }

    }

}


exports.download_single_presentantion_file = async (req, res, next) => {

    const presentantion_file_id = req.body.presentantion_file_id;
    const filename = req.body.filename;

    console.log("FILE NAME ", filename)

    const presentantionFileFound = await PresentantionFile.findByPk(presentantion_file_id);

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


    else {
        res.status(200).json({
            message: 'Publication did not found'
        })
    }




}