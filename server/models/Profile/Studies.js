
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const Studies = db.define('studies', {

  study_id:
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

  school:
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



module.exports = Studies;
