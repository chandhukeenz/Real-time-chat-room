const mongoose = require('mongoose');
const pwdHashBcrypt = require('bcrypt')

const unamePwdSchema = new mongoose.Schema({
    uname: {type: String, required: [true, 'Username is required']},
    pwd: {type: String, required: [true, 'Password is required']}
}, {collection: 'userData'})

unamePwdSchema.statics.validateRegisteredUser = async function (uname, pwd) {
    const matchedUName = await this.findOne({uname});
    if (matchedUName != null) {
        const isMatch = await pwdHashBcrypt.compare(pwd, matchedUName.pwd);
        return isMatch ? matchedUName : false;
    }
    return false;
}
unamePwdSchema.statics.validateExistingUser = async function (uname) {
    return !!await this.findOne({uname});
}
module.exports = mongoose.model('unamePwd', unamePwdSchema);