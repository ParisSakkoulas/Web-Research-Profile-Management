
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const TechReport = db.define('techReport', {

  tech_report_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  address:
  {
    type: DataTypes.STRING,
  },

  month:
  {
    type: DataTypes.ENUM("Not Defined", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
    defaultValue: 'January'
  },

  number:
  {
    type: DataTypes.STRING
  },

  type:
  {
    type: DataTypes.STRING
  },

  tech_report_year:
  {
    type: DataTypes.STRING
  },

  institution:
  {
    type: DataTypes.STRING,
    allowNull: false
  }


},
  { timestamps: false }
);



module.exports = TechReport;
