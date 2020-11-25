const Order = require('../models/Order');

module.exports = {
    createOrder, removeOrders, showOrders
}

function createOrder(orderData, customer) {
    var str = orderData.split(" ", 3);
    var order = new Order({name: str[0], quantity: str[1], weight: str[2], customer: customer});
    order.save(function (err) {
        if (err) console.log('error', err);
        else console.log('saved'); 
    });
}

function removeOrders(customer) {
    Order.deleteMany({customer: customer}, {$multi: true}, function (err) {
        if (err) console.log('error', err);
        else console.log('all orders were removed');
    });
}