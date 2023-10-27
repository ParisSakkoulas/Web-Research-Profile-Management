const Sequelize = require("sequelize");
const db = require("../config/db.config");
const { DataTypes } = Sequelize;


const File = db.define('File', {
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, { timestamps: false });



module.exports = File;