
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const Book = db.define('book', {

  book_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  publisher:
  {
    type: DataTypes.STRING,
    allowNull: false
  },

  volume:
  {
    type: DataTypes.STRING
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
    defaultValue: 'January'
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



module.exports = Book;
