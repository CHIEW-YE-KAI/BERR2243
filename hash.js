const bcrypt = require("bcryptjs");

const password = "chiewyekai60306";
const saltRounds = 5;

bcrypt.genSalt(saltRounds, function (saltError, salt) {
    if (saltError) {
        throw saltError;
    } else {
        bcrypt.hash(password, salt, function (hashError, hash) {
            if (hashError) {
                throw hashError;
            } else {
                console.log(hash);
            }
        }); 
    }
});
    