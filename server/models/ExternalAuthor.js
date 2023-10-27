const Sequelize = require("sequelize");
const db = require("../config/db.config");
const User = require("./User");
const { DataTypes } = Sequelize;


const ExternalAuthor = db.define('externalAuthor', {

    externalAuthor_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    firstName:
    {
        type: DataTypes.STRING,
        allowNull: false
    },

    lastName:
    {
        type: DataTypes.STRING,
        allowNull: false
    },



}, {}, { timestamps: false });



//Συσχέτιση δημοσίευσης με τον Αρχείο Άρθρου ή Αρχείο Περιεχομένου
//Μια δημοσίευση μπορεί να έχει πολλά αρχεία ενώ ένα αρχείο αφορά μια συγκεκριμένη δημοσίευση
User.hasMany(ExternalAuthor, { as: 'externalauthor', onDelete: 'CASCADE', foreignKey: 'userId' });
ExternalAuthor.belongsTo(User, { as: 'externalauthor', onDelete: 'CASCADE', foreignKey: 'userId' })


module.exports = ExternalAuthor;
