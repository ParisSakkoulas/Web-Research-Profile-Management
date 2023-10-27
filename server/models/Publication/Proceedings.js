
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const Proceeding = db.define('proceeding', {

  proceeding_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  editor:
  {
    type: DataTypes.STRING,
    allowNull: false
  },

  series:
  {
    type: DataTypes.STRING
  },

  pages:
  {
    type: DataTypes.STRING
  },

  month:
  {
    type: DataTypes.ENUM("Not Defined", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
    defaultValue: 'Not Defined'
  },

  organization:
  {
    type: DataTypes.STRING
  },

  address:
  {
    type: DataTypes.STRING
  },

  publisher:
  {
    type: DataTypes.STRING
  },



},
  { timestamps: false }
);



module.exports = Proceeding;
