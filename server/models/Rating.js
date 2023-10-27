
const Sequelize = require("sequelize");
const db = require("../config/db.config");
const Profile = require("./Profile/Profile");
const User = require("./User");
const { DataTypes } = Sequelize;

const Rating = db.define('rating', {

    rating_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    rate: {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    }
}
);


//Συσχέτιση των δύο πινάκων User και Article, 1-1 συσχέτιση.
User.hasMany(Rating, { as: 'ratings', onDelete: 'CASCADE', foreignKey: 'userCreatorId' });
Rating.belongsTo(User, { as: 'user', onDelete: 'CASCADE', foreignKey: 'userCreatorId' });


Profile.hasMany(Rating, { as: 'ratings', onDelete: 'CASCADE', foreignKey: 'profileId' });
Rating.belongsTo(Profile, { as: 'profile', onDelete: 'CASCADE', foreignKey: 'profileId' });


module.exports = Rating;
