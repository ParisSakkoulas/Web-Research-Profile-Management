
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const PublicationStats = db.define('publicationStats', {

    publication_stats_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    citations:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    references:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    num_of_exported_presentation_file:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    num_of_exported_content_file:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    reqs_of_exported_presentation_file:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    reqs_of_exported_content_file:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

},
    { timestamps: false }
);



module.exports = PublicationStats;
