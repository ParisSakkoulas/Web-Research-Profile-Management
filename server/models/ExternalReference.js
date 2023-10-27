const Sequelize = require("sequelize");
const db = require("../config/db.config");
const { DataTypes } = Sequelize;


const ExternalPublication = db.define('externalPublication', {

    externalPublication_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    title:
    {
        type: DataTypes.STRING,
        allowNull: false
    },


    year:
    {
        type: DataTypes.STRING,
        validate: {
            is: /(?:(?:18|19|20|21)[0-9]{2})/
        }
    },

    link:
    {
        type: DataTypes.TEXT('long')
    }


}, {}, { timestamps: false });



module.exports = ExternalPublication;
