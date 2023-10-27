
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const User = require("../User");
const { DataTypes } = Sequelize;

const Conference = db.define('conference', {

    conference_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    abbreviation:
    {
        type: DataTypes.STRING,
        allowNull: false
    },



},
    { timestamps: false }
);





module.exports = Conference;
