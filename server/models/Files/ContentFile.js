const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;


const ContentFile = db.define('contentFile', {

    content_file_id:
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
        type: DataTypes.ENUM("public", "some", "private"),
        default: 'private',
        allowNull: false,
    }


}, { timestamps: false });



module.exports = ContentFile;