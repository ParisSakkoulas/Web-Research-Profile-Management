const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const Profile = require("./Profile");
const User = require("../User");

const { DataTypes } = Sequelize;

const NetworkReferences = db.define('networkreferences', {

    frequency: {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    }




},
    { timestamps: false }
);


module.exports = NetworkReferences;
