
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const User = require("../User");
const { DataTypes } = Sequelize;

const Journal = db.define('journal', {

    journal_id:
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

    publisher:
    {
        type: DataTypes.STRING,
        allowNull: false
    },


},
    { timestamps: false }
);





module.exports = Journal;
