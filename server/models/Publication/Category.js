
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const User = require("../User");
const { DataTypes } = Sequelize;

const Category = db.define('category', {

  category_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  name:
  {
    type: DataTypes.STRING,
    allowNull: false
  },

  description:
  {
    type: DataTypes.TEXT('medium')
  },

  state:
  {
    type: DataTypes.ENUM("All", "Uncategorized", "Manual"),
    allowNull: false,
    defaultValue: 'Manual'
  }

},
  { timestamps: false }
);



//Συσχέτιση δημοσίευσης με τον Χρήστη
// Ένας χρήστης μπορεί να κατέχει πολλές δημοσιεύσεις ενώ μια δημοσίευση μπορεί να  ανήκει σε έναν μόνο Χρήστη. Σχέση 1 - Ν
User.hasMany(Category, { as: 'categories', onDelete: 'CASCADE', foreignKey: 'userId' });
Category.belongsTo(User, { as: 'user', onDelete: 'CASCADE', foreignKey: 'userId' })



module.exports = Category;
