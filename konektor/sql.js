require('dotenv').config();
// -- Mysql
var mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.mysql_host,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    database: process.env.mysql_database,
    port: 3306
});
connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to database");
});
module.exports = {
    connection,
}