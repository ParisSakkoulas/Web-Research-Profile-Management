const ExternalPublication = require("../models/ExternalReference");
const Book = require("../models/Publication/Book");
const Conference = require("../models/Publication/Conference");
const Journal = require("../models/Publication/Journal");
const Publication = require("../models/Publication/Publication");
const PublicationPlace = require("../models/Publication/PublicationPlace")
const { Sequelize, Op } = require('sequelize');





exports.add_new_publication_place = async (req, res, next) => {


    const publication_place_obj = {
        name: req.body.name,
        type: req.body.type
    }


    try {
        const publication_place_created = await PublicationPlace.create(publication_place_obj);


        //Έπειτα γίνεται η δημίουργία των αντίστοιχων αντικειμένων που χρειάζεται και η συσχέτιση αυτήν με τον τόπο
        switch (publication_place_obj.type) {

            case 'Conference':
                const conference_obj = {
                    abbreviation: req.body.abbreviation
                }
                const conference_created = await Conference.create(conference_obj);
                await publication_place_created.setConference(conference_created)
                break;


            case 'Book':
                const bookObj = {
                    publisher: req.body.publisher,
                    volume: req.body.volume,
                    series: req.body.series,
                    pages: req.body.pages,
                    month: req.body.month,
                    address: req.body.address,
                    version: req.body.version,
                }
                const book_created = await Book.create(bookObj);
                await publication_place_created.setBook(book_created)
                break;



            case 'Journal':

                const journalObj = {
                    abbreviation: req.body.abbreviation,
                    publisher: req.body.publisher
                }
                const journal_created = await Journal.create(journalObj);
                console.log(publication_place_created)
                await publication_place_created.setJournal(journal_created)
                break

        }


        if (publication_place_created) {

            res.status(200).json({
                message: 'Publication Place created',
                publication_place_created: publication_place_created
            })

        }

        else {
            res.status(400).json({
                message: 'Publication Place error'
            })
        }
    } catch (err) {

        console.log(err)
    }





}



exports.get_all_publication_places = async (req, res, next) => {


    try {
        const publication_places = await PublicationPlace.findAll({
            include: [{ model: Conference }, { model: Journal }, { model: Book }]
        });


        if (publication_places) {
            res.status(200).json({
                message: 'Publication places found',
                publication_places: publication_places
            })
        }

        else {
            res.status(200).json({
                message: 'Error on finding Publication places'
            })
        }
    } catch (err) {
        console.log(err)
    }



}


exports.get_single_publication_place = async (req, res, next) => {

    console.log(req.params.id);

    try {

        const singlePublicationPlaceFound = await PublicationPlace.findByPk(req.params.id, {
            include: [{ model: Conference }, { model: Journal }, { model: Book }]
        });


        if (singlePublicationPlaceFound) {
            res.status(200).json({
                message: 'Publication places found',
                singlePublicationPlaceFound: singlePublicationPlaceFound
            })
        }


    } catch (err) {
        console.log(err)
    }

}


exports.get_live_publication_places = async (req, res, next) => {

    const query = req.body.query;


    try {


        let resultForNameBased = await PublicationPlace.findAll({
            where: {
                name: {
                    [Op.like]: `${query.toLowerCase()}%`
                }
            }
        }, {
            include: [{ model: Conference }, { model: Journal }, { model: Book }]
        });

        let resultForTypeBased = await PublicationPlace.findAll({
            where: {
                type: {
                    [Op.like]: `${query.toLowerCase()}%`
                }
            }
        }, {
            include: [{ model: Conference }, { model: Journal }, { model: Book }]
        });


        console.log(resultForTypeBased)
        console.log(resultForNameBased)


        res.status(200).json({
            message: 'Publication places found',
            resultForTypeBased: resultForTypeBased,
            resultForNameBased: resultForNameBased
        })

    } catch (err) {
        console.log(err)
    }




}


exports.upldate_single_publication_place = async (req, res, next) => {


    //check if it referes to other publications
    const publicationPlaceFound = await PublicationPlace.findByPk(req.params.id, {
        include: [{
            model: Publication,
            as: 'publications',
        }]
    });

    if (publicationPlaceFound) {

        const publications = await publicationPlaceFound.publications
        if (publications.length > 0) {
            console.log(publications)
            res.status(200).json({
                message: 'You can not update this place. It is in use.',
                state: 'NO'
            })
        }

        else {

            publicationPlaceFound.name = req.body.name;
            publicationPlaceFound.save()

            switch (publicationPlaceFound.type) {

                case 'Journal':
                    const journalFound = await Journal.findOne({ where: { publication_place_id: publicationPlaceFound.publication_place_id } })

                    if (journalFound) {
                        journalFound.abbreviation = req.body.abbreviation;
                        journalFound.publisher = req.body.publisher;
                        journalFound.save();
                    }
                    break;

                case 'Conference':
                    const conferenceFound = await Conference.findOne({ where: { publication_place_id: publicationPlaceFound.publication_place_id } })

                    if (conferenceFound) {
                        conferenceFound.abbreviation = req.body.abbreviation;
                        conferenceFound.save();

                    }
                    break;

                case 'Book':

                    const bookFound = await Book.findOne({ where: { publication_place_id: publicationPlaceFound.publication_place_id } })

                    if (bookFound) {
                        bookFound.publisher = req.body.publisher;
                        bookFound.volume = req.body.volume;
                        bookFound.series = req.body.series;
                        bookFound.pages = req.body.pages;
                        bookFound.month = req.body.month;
                        bookFound.address = req.body.address;
                        bookFound.version = req.body.version;

                        bookFound.save();

                    }
                    break;

            }



            res.status(200).json({
                message: 'Place updated successfully',
                state: 'YES'
            })
        }

    }


}


exports.delete_single_publication_place = async (req, res, next) => {

    //check if it referes to other publications

    const publicationPlaceFound = await PublicationPlace.findByPk(req.params.id, {
        include: [{
            model: Publication,
            as: 'publications',
        }]
    });

    if (publicationPlaceFound) {

        const publications = await publicationPlaceFound.publications
        if (publications.length > 0) {
            console.log(publications)
            res.status(200).json({
                message: 'You can not delete this place. It is in use.',
                state: 'NO'
            })
        }

        else {
            await publicationPlaceFound.destroy();
            res.status(200).json({
                message: 'Place deleted successfully',
                state: 'YES'
            })
        }

    }

    //delete


}

exports.delete_many_publication_places = async (req, res, next) => {

    //check if it referes to other publications

    //delete

}