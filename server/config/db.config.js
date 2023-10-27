const { Sequelize, Op } = require('sequelize');

Sequelize.Op = Op;
const operatorsAliases = {
  $like: Op.like,
  $not: Op.not
}

//Καθορισμός των παραμέτρων για την σύνδεση
const sequelize = new Sequelize('newDb', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },



}, {
  operatorsAliases
});


sequelize.sync({ alter: true }).then(data => {

  console.log("Tables sync with models successfully!")

}).catch(err => {

  console.log("Error on syncing tables and models ", err)

})



module.exports = sequelize;


