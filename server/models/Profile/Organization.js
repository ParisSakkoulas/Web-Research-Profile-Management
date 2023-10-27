const Sequelize = require("sequelize");
const db = require("../../config/db.config");

const { DataTypes } = Sequelize;


const Organization = db.define('organization', {

    organization_id:
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

    description:
    {
        type: DataTypes.TEXT('medium')
    },




},
    { timestamps: false }
);


module.exports = Organization;