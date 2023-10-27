const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const PresentantionFile = db.define('presentantionFile', {

    presentantion_file_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    path: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    access: {
        type: DataTypes.ENUM("Public", "Some", "Private"),
        default: 'Private'
    }


}, { timestamps: false });



module.exports = PresentantionFile;