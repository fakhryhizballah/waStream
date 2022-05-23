const { connection } = require('../konektor/sql');

let log = function (nohp, status, pesan) {
    let date_ob = new Date();
    var sql = `INSERT INTO pesan SET nohp= ?, status= ?, pesan= ?, created_at= ?, updated_at= ?`;
    connection.query(sql, [nohp, status, pesan, date_ob, date_ob], function (err, result) {
        if (err) throw err;
        console.log("pesan records: " + result.affectedRows);
    });
}
let status = function (nohp, status) {
    let date_ob = new Date();
    var sql = `UPDATE pesan SET nohp= ?, status= ?, updated_at= ? WHERE nohp= ?`;
    connection.query(sql, [nohp, status, date_ob, nohp], function (err, result) {
        if (err) throw err;
        console.log("status records: " + result.affectedRows);
    });
}

module.exports = {
    log,
    status
}