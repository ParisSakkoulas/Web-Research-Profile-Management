
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const ChapterBk = db.define('chapterBk', {

  book_chapter_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  chapter:
  {
    type: DataTypes.STRING,
    allowNull: false
  },

  publisher:
  {
    type: DataTypes.STRING
  },

  pages:
  {
    type: DataTypes.STRING
  },

  volume:
  {
    type: DataTypes.STRING
  },

  series:
  {
    type: DataTypes.STRING
  },

  type:
  {
    type: DataTypes.STRING
  },

  month:
  {
    type: DataTypes.ENUM("Not Defined", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
    defaultValue: 'Not Defined'
  },

  address:
  {
    type: DataTypes.STRING
  },

  version:
  {
    type: DataTypes.STRING
  },



},
  { timestamps: false }
);



module.exports = ChapterBk;
