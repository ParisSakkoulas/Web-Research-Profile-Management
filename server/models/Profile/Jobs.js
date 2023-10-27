
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const Job = db.define('job', {

  job_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  title:
  {
    type: DataTypes.STRING,
    allowNull: false
  },

  company:
  {
    type: DataTypes.STRING,
    allowNull: false
  },

  startYear:
  {
    type: DataTypes.STRING,
    allowNull: false
  },

  endYear:
  {
    type: DataTypes.STRING,
    allowNull: false
  },

},
  { timestamps: false }
);



module.exports = Job;
