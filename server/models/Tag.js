
const Sequelize = require("sequelize");
const db = require("../config/db.config");
const { DataTypes } = Sequelize;

const Tag = db.define('tag', {

    tag_id:
    {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    keyword:
    {
        type: DataTypes.STRING,
        allowNull: false
    }


},
    { timestamps: false }
);



module.exports = Tag;
