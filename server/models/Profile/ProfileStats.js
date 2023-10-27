
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const Profile = require("./Profile");
const { DataTypes } = Sequelize;

const ProfileStats = db.define('profileStats', {

    profile_stats_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    total_publications:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    publicationsPerYear: {
        type: DataTypes.JSON,
        defaultValue: {},
    },

    num_of_profile_views:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    num_of_citations:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },
    citationsPerYear: {
        type: DataTypes.JSON,
        defaultValue: {},
    },

    hIndex:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    followers:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    following:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    i_10index:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

    rating:
    {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
        }
    },

},
    { timestamps: false }
);

//Συσχέτιση των δύο πινάκων ProfileStats και Profile, 1-1 συσχέτιση.
Profile.hasOne(ProfileStats, { onDelete: 'CASCADE', foreignKey: 'profileId' });
ProfileStats.belongsTo(Profile, { onDelete: 'CASCADE', foreignKey: 'profileId' });


module.exports = ProfileStats;
