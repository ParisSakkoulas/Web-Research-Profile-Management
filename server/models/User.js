
const Sequelize = require("sequelize");
const db = require("../config/db.config");
const Profile = require("./Profile/Profile");
const { DataTypes } = Sequelize;

const User = db.define('user', {

    user_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    email:
    {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    userName:
    {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate:
        {
            is: /^_[A-Za-z0-9]{2,}$/
        }
    },

    password:
    {
        type: DataTypes.STRING,
        allowNull: false
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

    userStatus:
    {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: 'Inactive',
        allowNull: false
    },



    userRole:
    {
        type: DataTypes.ENUM("Simple", "Admin"),
        defaultValue: 'Simple',
        allowNull: false
    },

    uniqueString:
    {
        type: DataTypes.STRING,
        isUnique: true,
        allowNull: false

    },

    loginAttemps:
    {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }


},
    { timestamps: false }
);

//Συσχέτιση των δύο πινάκων User και Article, 1-1 συσχέτιση.
User.hasOne(Profile, { onDelete: 'CASCADE', foreignKey: 'userId' });
Profile.belongsTo(User, { onDelete: 'CASCADE', foreignKey: 'userId' });

User.belongsToMany(User, { through: 'userFollowings', as: 'followers', foreignKey: 'followingId' });
User.belongsToMany(User, { through: 'userFollowings', as: 'following', foreignKey: 'followerId' });



module.exports = User;
