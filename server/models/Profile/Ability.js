
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const Ability = db.define('ability', {

  ability_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  keyword:
  {
    type: DataTypes.STRING,
    allowNull: false
  },

},
  { timestamps: false }
);



module.exports = Ability;
