const ContentFile = require("../models/Files/ContentFile");
const { Sequelize, Op } = require('sequelize');
const fs = require('fs');
const fsExtra = require('fs-extra');


const path = require('path');
const Publication = require("../models/Publication/Publication");
Sequelize.Op = Op;
const operatorsAliases = {
    $like: Op.like,
    $not: Op.not
}


exports.remove_single_content_file = async (req, res, next) => {



    console.log(req.params.id)

    const contentFileFound = await ContentFile.findByPk(req.params.id);

    if (contentFileFound) {


        //παίρνουμε το user id
        const userId = req.userData.userId;
        const accessForContentFile = contentFileFound.access;
        const fileName = contentFileFound.filename;
        const targetDirectory = `./uploads/${userId}/${contentFileFound.publicationId}/${accessForContentFile}`;
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


        await contentFileFound.destroy();


        res.status(200).json({
            message: 'Content File Removed Successfully!'
        })
    }

    else {
        res.status(200).json({
            message: 'Could not find this file'
        })
    }

    console.log(contentFileFound)


}

exports.replace_single_content_file = async (req, res, next) => {


    console.log(req.files)


    try {
        if (req.files['contentFile']) {

            const contendFileFound = await ContentFile.findByPk(req.params.id);

            if (contendFileFound) {




                //παίρνουμε το user id
                const userId = req.userData.userId;
                const accessForContentFile = req.body.contentFileAccess;
                const contentFile = req.files['contentFile'];
                const folderPath = './uploads/' + userId;
                const fileName = contentFile.originalname;
                const filePath = folderPath + '/' + fileName;
                const file = req.files['contentFile'][0];
                const targetDirectory = `./uploads/${userId}/${contendFileFound.publicationId}/${accessForContentFile}`;
                const targetPath = `${targetDirectory}/${file.originalname}`;

                //Δημιουργία νέου φακέλου και αρχείου 
                if (!fs.existsSync(targetDirectory)) {
                    fs.mkdirSync(targetDirectory, { recursive: true });
                }
                fs.renameSync(file.path, targetPath);

                const oldFilePath = `${targetDirectory}/${contendFileFound.filename}`;

                console.log(oldFilePath)
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath)
                }



                //Αλλαγή τιμών στη βάση για το contendFile
                contendFileFound.filename = req.files['contentFile'][0].filename;
                contendFileFound.type = path.extname(req.files['contentFile'][0].filename);
                contendFileFound.access = req.body.contentFileAccess;
                await contendFileFound.save();




                res.status(200).json({
                    message: 'File updated successfully',
                    newPath: targetPath,
                    type: path.extname(req.files['contentFile'][0].filename)
                })
            }

        }
    } catch (err) {
        console.log("ERROR", err)
    }


}


exports.download_single_content_file = async (req, res, next) => {

    const content_file_id = req.body.content_file_id;
    const filename = req.body.filename;

    const contentFileFound = await ContentFile.findByPk(content_file_id);

    if (contentFileFound) {


        const publicationFound = await Publication.findOne({ where: { publication_id: contentFileFound.publicationId } })


        let userId;
        if (publicationFound) {
            console.log("pubFound", publicationFound)
            userId = publicationFound.userId
        }


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


    else {
        res.status(200).json({
            message: 'Publication did not found'
        })
    }




}