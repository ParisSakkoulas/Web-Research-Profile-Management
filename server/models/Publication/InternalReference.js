
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;
const InternalReference = db.define("InternalReferences", {}, { timestamps: false });


module.exports = InternalReference;