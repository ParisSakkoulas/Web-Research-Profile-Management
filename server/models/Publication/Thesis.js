
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const Thesis = db.define('thesis', {

  thesis_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  school:
  {
    type: DataTypes.STRING,
    allowNull: false,
  },

  type:
  {
    type: DataTypes.ENUM("Master", "PhD", "Other"),
    defaultValue: 'Master',
    allowNull: false,
  },

  month:
  {
    type: DataTypes.STRING
  },

  address:
  {
    type: DataTypes.STRING
  },



},
  { timestamps: false }
);



module.exports = Thesis;
