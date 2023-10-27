
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;


const Article = db.define('article', {

  article_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  jurnal:
  {
    type: DataTypes.STRING,
    allowNull: false
  },

  number:
  {
    type: DataTypes.STRING,
  },

  volume:
  {
    type: DataTypes.STRING,
  },

  pages:
  {
    type: DataTypes.STRING,
  },

  month:
  {
    type: DataTypes.ENUM("Not Defined", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
    defaultValue: 'Not Defined'
  }


}, { timestamps: false });



module.exports = Article;
