const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const Profile = require("./Profile");
const { DataTypes } = Sequelize;


const PhotoProfile = db.define('photoProfile', {

    photo_file_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    path: {
        type: DataTypes.STRING,
        allowNull: false,
    }


}, { timestamps: false });


Profile.hasOne(PhotoProfile, { onDelete: 'CASCADE', foreignKey: 'photoProfileId' });
PhotoProfile.belongsTo(Profile, { onDelete: 'CASCADE', foreignKey: 'photoProfileId' });


module.exports = PhotoProfile;