
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const PublicationTags = db.define('publicationTags', {
},
  { timestamps: false }
);



module.exports = PublicationTags;
