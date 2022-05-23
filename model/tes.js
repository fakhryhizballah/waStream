const { connection } = require('../konektor/sql');

// connection.query("SELECT * FROM valid_wa WHERE nohp = '089'", function (err, result) {
//     if (err) throw err;
//     console.log(result[0].id);
//     // return resolve(results);
//     // return resolve(resultArray[0]);
// });

var getMesin = function (mesinID) {
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM valid_wa WHERE nohp = '089'", (err, result) => {
            if (err) {
                return reject(error);
            }
            return resolve(result[0]);

        });

    });
}
// console.log(getMesin());
var test = async function () {
    var result = await getMesin();
    console.log(result);
    if (result == undefined) {
        console.log("undefined");
    } else {
        console.log(result.id);
    }
}
test();