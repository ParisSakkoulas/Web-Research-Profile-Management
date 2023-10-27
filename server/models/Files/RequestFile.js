const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const ContentFile = require("./ContentFile");
const PresentantionFile = require("./PresentantionFile");
const User = require("../User");
const { DataTypes } = Sequelize;


const RequestFile = db.define('requestFile', {

    request_file_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },


    file_type: {
        type: DataTypes.ENUM("Presentantion", "Content"),
        default: 'Content',
        allowNull: false,
    },

    state: {
        type: DataTypes.ENUM("pending", "accepted", "declined"),
        default: 'pending'
    },


    description: {
        type: DataTypes.TEXT('medium')
    }


});

//Συσχέτιση δημοσίευσης με τον Χρήστη
// Ένα προφιλ συσχετίζεται με πολλά Job ενώ κάθε Job αφορά ένα συγκεκριμένο Profile
ContentFile.hasMany(RequestFile, { as: 'contentFileRequests', onDelete: 'CASCADE', foreignKey: 'contentFileId' });
RequestFile.belongsTo(ContentFile, { as: 'contentFile', onDelete: 'CASCADE', foreignKey: 'contentFileId' });


PresentantionFile.hasMany(RequestFile, { as: 'presentantionFileRequests', onDelete: 'CASCADE', foreignKey: 'presentantionFileId' });
RequestFile.belongsTo(PresentantionFile, { as: 'presentantionFile', onDelete: 'CASCADE', foreignKey: 'presentantionFileId' });



User.hasMany(RequestFile, { as: 'requests', onDelete: 'CASCADE', foreignKey: 'userId' });
RequestFile.belongsTo(User, { as: 'user', onDelete: 'CASCADE', foreignKey: 'userId' });




module.exports = RequestFile;