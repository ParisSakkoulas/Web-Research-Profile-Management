
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const User = require("../User");
const Journal = require("./Journal");
const Conference = require("./Conference");
const Book = require("./Book");
const Publication = require("./Publication");
const { DataTypes } = Sequelize;

const PublicationPlace = db.define('publicationPlace', {

    publication_place_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    name:
    {
        type: DataTypes.STRING,
        allowNull: false
    },

    type:
    {
        type: DataTypes.ENUM("Conference", "Book", "Journal"),
        allowNull: false,
        defaultValue: 'Journal'
    }


},
    { timestamps: false }
);




//Συσχέτιση Τόπου Δημοσίευσης με Δημοσίευση
// Ένα τόποσ δημοσίευσης μπορεί να έχει πολλές δημοσιεύσεις ενώ μια δημοσίευση μπορεί να ανήκει σε έναν μόνο τόπο
PublicationPlace.hasMany(Publication, { as: 'publications', onDelete: 'CASCADE', foreignKey: 'place_id' });
Publication.belongsTo(PublicationPlace, { as: 'place', onDelete: 'CASCADE', foreignKey: 'place_id' })

//Συσχέτιση των δύο πινάκων PublicationPlace και Journal, 1-1 συσχέτιση.
PublicationPlace.hasOne(Journal, { onDelete: 'CASCADE', foreignKey: 'publication_place_id' });
Journal.belongsTo(PublicationPlace, { onDelete: 'CASCADE', foreignKey: 'publication_place_id' });

//Συσχέτιση των δύο πινάκων PublicationPlace και Conference, 1-1 συσχέτιση.
PublicationPlace.hasOne(Conference, { onDelete: 'CASCADE', foreignKey: 'publication_place_id' });
Conference.belongsTo(PublicationPlace, { onDelete: 'CASCADE', foreignKey: 'publication_place_id' });


//Συσχέτιση των δύο πινάκων PublicationPlace και Conference, 1-1 συσχέτιση.
PublicationPlace.hasOne(Book, { onDelete: 'CASCADE', foreignKey: 'publication_place_id' });
Book.belongsTo(PublicationPlace, { onDelete: 'CASCADE', foreignKey: 'publication_place_id' });




module.exports = PublicationPlace;
