
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const Other = db.define('other', {

    other_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    subType:
    {
        type: DataTypes.TEXT,
        allowNull: false
    },

    grantNumber:
    {
        type: DataTypes.TEXT
    },

    pages:
    {
        type: DataTypes.TEXT,
        defaultValue: 'Not Defined'
    },

    month:
    {
        type: DataTypes.ENUM("Not Defined", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
        defaultValue: 'Not Defined'
    }



});


module.exports = Other;
