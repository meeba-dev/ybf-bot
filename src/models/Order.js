var mongoose = require('mongoose');

var OrderSchema = mongoose.Schema({
    name: String,
    quantity: String,
    weight: String,
    customer: String
},
{
    versionKey: false
    //_id: false
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;