const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const Profile = require("./Profile");
const User = require("../User");
const NetworkCooperations = require("./NetworkCooperations");
const NetworkTopCooperations = require("./NetworkTopCooperations");
const NetworkReferences = require("./NetworkReferences");
const NetworkTopReferences = require("./NetworkTopReferences");

const { DataTypes } = Sequelize;

const Network = db.define('network', {

    network_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },




},
    { timestamps: false }
);

//Συσχέτιση των δύο πινάκων User και Network, 1-1 συσχέτιση.
Profile.hasOne(Network, { onDelete: 'CASCADE', foreignKey: 'profileId' });
Network.belongsTo(Profile, { onDelete: 'CASCADE', foreignKey: 'profileId' });

//Συσχέτιση Network για του συνεργάτες
Network.belongsToMany(User, { through: NetworkCooperations });
User.belongsToMany(Network, { through: NetworkCooperations });

//Συσχέτιση Network για του τοπ συνεργάτες
Network.belongsToMany(User, { through: NetworkTopCooperations });
User.belongsToMany(Network, { through: NetworkTopCooperations });

//Συσχέτιση Network για τους ερευνητές που αναφέρονται 
Network.belongsToMany(User, { through: NetworkReferences });
User.belongsToMany(Network, { through: NetworkReferences });


//Συσχέτιση Network για τους τοπ ερευνητές που αναφέρονται 
Network.belongsToMany(User, { through: NetworkTopReferences });
User.belongsToMany(Network, { through: NetworkTopReferences });




module.exports = Network;