
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const ProfileView = db.define('profileView', {

    profileView_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },




}
);



module.exports = ProfileView;
