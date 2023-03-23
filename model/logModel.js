const { connection } = require('../konektor/sql');

let logs = function (nohp, pesan, status) {
    let date_ob = new Date();
    var sql = `INSERT INTO pesan SET nohp= ?, status= ?, pesan= ?, created_at= ?, updated_at= ?`;
    connection.query(sql, [nohp, status, pesan, date_ob, date_ob], function (err, result) {
        if (err) throw err;
        console.log("pesan records: " + result.affectedRows);
    });
}
let status = async function (nohp, status) {
    let date_ob = new Date();
    let result = await cekNumber(nohp);
    if (result == undefined) {
        let sql = `INSERT INTO valid_wa SET nohp= ?, status= ?, hit= ?,created_at= ?, updated_at= ?`;
        connection.query(sql, [nohp, status, 1, date_ob, date_ob], function (err, result) {
            if (err) throw err;
            console.log("valid_wa records: " + result.affectedRows);
        });
    } else {
        result.hit = parseInt(result.hit);
        let sql = `UPDATE valid_wa SET status= ?, hit= ?, updated_at= ? WHERE nohp= ?`;
        connection.query(sql, [status, result.hit + 1, date_ob, nohp], function (err, result) {
            if (err) throw err;
            console.log("valid_wa records update: " + result.affectedRows);
        });
    }
}

const cekNumber = function (nohp) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM valid_wa WHERE nohp = ?`;
        connection.query(sql, [nohp], (err, result) => {
            if (err) {
                return reject(error);
            }
            return resolve(result[0]);
        });
    });
}

module.exports = {
    logs,
    status
}