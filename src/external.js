module.exports = {
    debug, logStart
};

function debug(obj = {}) {
    return JSON.stringify(obj, null, 4);
}
function logStart() {
    console.log("Bot has been launched ... ");
}
