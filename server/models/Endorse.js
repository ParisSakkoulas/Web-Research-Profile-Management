const Sequelize = require("sequelize");
const db = require("../config/db.config");
const User = require("./User");
const Profile = require("./Profile/Profile");
const { DataTypes } = Sequelize;


const Endorse = db.define('endorse', {

    endorse_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    evidence:
    {
        type: DataTypes.STRING,
    },

    endorsement:
    {
        type: DataTypes.STRING,
        allowNull: false
    },


});


User.hasMany(Endorse, { as: 'endorsement', onDelete: 'CASCADE', foreignKey: 'userId' });
Endorse.belongsTo(User, { as: 'userCreator', onDelete: 'CASCADE', foreignKey: 'userId' });


Profile.hasMany(Endorse, { as: 'endorsements', onDelete: 'CASCADE', foreignKey: 'profileId' });
Endorse.belongsTo(Profile, { as: 'profile', onDelete: 'CASCADE', foreignKey: 'profileId' });



module.exports = Endorse;