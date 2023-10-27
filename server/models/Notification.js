
const Sequelize = require("sequelize");
const db = require("../config/db.config");
const Profile = require("./Profile/Profile");
const User = require("./User");
const RequestFile = require("./Files/RequestFile");
const { DataTypes } = Sequelize;

const Notification = db.define('notification', {

    notification_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    type:
    {
        type: DataTypes.STRING,
        allowNull: false
    },

    title:
    {
        type: DataTypes.STRING
    },

    content:
    {
        type: DataTypes.TEXT('medium')
    },

    status:
    {
        type: DataTypes.ENUM("Unread", "Read", "Dissmissed"),
        allowNull: false,
    }


});


//Συσχέτιση δημοσίευσης με τον Χρήστη
// Ένας χρήστης μπορεί να κατέχει πολλές δημοσιεύσεις ενώ μια δημοσίευση μπορεί να  ανήκει σε έναν μόνο Χρήστη. Σχέση 1 - Ν
User.hasMany(Notification, { as: 'notifications', onDelete: 'CASCADE', foreignKey: 'userToNotify' });
Notification.belongsTo(User, { as: 'user', onDelete: 'CASCADE', foreignKey: 'userToNotify' });


User.hasMany(Notification, { as: 'createdNotifications', onDelete: 'CASCADE', foreignKey: 'userCreator' });
Notification.belongsTo(User, { as: 'creator', onDelete: 'CASCADE', foreignKey: 'userCreator' });


Notification.hasOne(RequestFile, { foreignKey: 'notificationId' });
RequestFile.belongsTo(Notification, { foreignKey: 'notificationId' });


module.exports = Notification;
