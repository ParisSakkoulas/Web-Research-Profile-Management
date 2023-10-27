const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const Profile = require("./Profile");
const User = require("../User");

const { DataTypes } = Sequelize;

const NetworkTopReferences = db.define('networktopreferences', {

    frequency: {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    }




},
    { timestamps: false }
);


module.exports = NetworkTopReferences;
