'use strict'

const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const fs = require('fs');
const request = require('request');
const {logStart} = require('./src/external');
const mongoose = require('mongoose');

var bot;
if (process.env.TELEGRAM_TOKEN) {
  	bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
    	polling: true
	});
	mongoose.connect(process.env.DB_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	}).then(() => console.log('MongoDB connected'))
	  .catch((err) => console.log(err));
} 
else {
	const config = require('./src/config.json');
	bot = new TelegramBot(config.TELEGRAM_TOKEN, {
		polling: true
	});
	mongoose.connect(config.DB_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	}).then(() => console.log('MongoDB connected'))
	  .catch((err) => console.log(err));
}
logStart();

const {debug} = require('./src/external');
const { createOrder } = require('./src/repository/OrderRepository');
const { removeOrders } = require('./src/repository/OrderRepository');

const keyboard_start = [
	[
		{
			text: 'Add',
			callback_data: 'add'
		},
		{
			text: 'Send',
			callback_data: 'send'
		}
	],
	[
		{
			text: 'Show',
			callback_data: 'show'
		},
		{
			text: 'Remove',
			callback_data: 'remove'
		}
	]
]
const keyboard_exchange = [
	[
		{
			text: 'FIAT',
			callback_data: 'fiat',
		},
		{
			text: 'CRYPTO',
			callback_data: 'crypto'
		}
	]
]
const keyboard_fiat = [
	[
		{
			text: '$ USD',
			callback_data: 'USD'
		},
		{
			text: '€ EUR',
			callback_data: 'EUR'
		}
	],
	[
		{
			text: '£ GBP',
			callback_data: 'GBP'
		},
		{
			text: 'CFr CHF',
			callback_data: 'CHF'
		}
	],
	[
		{
			text: 'zł PLN',
			callback_data: 'PLN'
		},
		{
			text: 'Kč CZK',
			callback_data: 'CZK'
		}
	],
	[
		{
			text: '$ CAD',
			callback_data: 'CAD'
		},
		{
			text: '¥ CNY',
			callback_data: 'CNY'
		}
	]	
]
const keyboard_crypto = [
	[
		{
			text: '₿ BTC',
			callback_data: 'BTC'
		},
		{
			text: '฿ BCH',
			callback_data: 'BCH'
		}
	],
	[
		{
			text: 'Ξ ETH',
			callback_data: 'ETH'
		},
		{
			text: 'Ł LTC',
			callback_data: 'LTC'
		}
	]
]

bot.onText(/\/start/, (msg) => {
	bot.sendMessage(msg.chat.id, "Hello " + msg.from.first_name + ". " + "I'm U the Bot." + "\n")
	bot.sendMessage(msg.chat.id, "Select the command: ", {
		reply_markup: {
			inline_keyboard: keyboard_start
		}
	});
});

bot.onText(/\/help/, (msg) => {
	bot.sendMessage(msg.chat.id,  'If you want to know about my capabilities,' + '\n' +
								  'check the information below ' + '\n' +
								  '/start – Launch the bot,' + '\n' +
								  '/help – See this message' + '\n' +
								  '/exchange – See the exchange rates' + '\n' +
								  '/finish - Finish to work with bot');
});

bot.onText(/\/chuck/, (msg) => {
	bot.sendVideo(msg.chat.id, "https://media.giphy.com/media/Lx8lyPHGfdNjq/giphy.gif");
});

bot.onText(/\/echo (.+)/, (msg, [source, match]) => {
	const chatId = msg.chat.id;
	const response = match;
	bot.sendMessage(chatId, response);
});
/*
bot.on('message', msg => {
	const {id} = msg.chat;
	bot.sendMessage(id, debug(msg));
});
*/
bot.onText(/\/exchange/, (msg) => {
	bot.sendMessage(msg.chat.id, 'Choose the type:', {
		reply_markup: {
			inline_keyboard: keyboard_exchange
		}
	});
});

bot.onText(/\/finish/, (msg) => {
	bot.sendMessage(msg.chat.id, "See you later Master!");
});

bot.on('callback_query', function(query) {
		const chatId = query.message.chat.id;
		const user = query.message.chat.first_name;

		switch(query.data) {
			case 'add':
				bot.sendMessage(chatId, 'Enter the data of order by using next format:' +
				 '\n' + "{ Name Quantity Weight }");
				bot.onText(/(.+)/, (msg, [source, match]) => {
					var inputOrder = msg.text;
					var customer = msg.from.first_name;
					createOrder(inputOrder, customer);
				})
				break;		
			case 'show':
				bot.sendMessage(chatId, 'Sorry, it\'s under construction');
				break;
			case 'remove':
				var customer = user;
				removeOrders(customer);
				bot.sendMessage(chatId, 'Your grocery list was successfully removed!')
				break;
			case 'send':
				bot.sendMessage(chatId, 'Sorry, it\'s under construction');
				break;
			case 'fiat':
				bot.sendMessage(chatId, 'Choose the currency:', {
					reply_markup: {
						inline_keyboard: keyboard_fiat
					}
				});
				break;
			case 'crypto':
				bot.sendMessage(chatId, 'Choose the currency:', {
					reply_markup: {
						inline_keyboard: keyboard_crypto
					}
				});
				break;
			case 'BTC':
			case 'BCH':
			case 'ETH':
			case 'LTC':
				var currency = query.data;
				var token = '2c87938fc0fcc2e25a6b3793796b9d01';
				request('http://api.coinlayer.com/api/live?access_key=' + token, 
				function(error, response, body) {
				const data = JSON.parse(body).rates;
				var result = Math.round(data[currency] * 100) / 100;
				let ms = "1 " + currency + ' = ' + result + ' $';
				bot.sendMessage(chatId, ms);	
				});
				break;
			default:
				var currency = query.data;
				request('https://api.exchangeratesapi.io/latest', 
				function(error, response, body) {
				const data = JSON.parse(body).rates;
				if (currency === "EUR") {
					var result = Math.round(data["RUB"] * 100) / 100;
				}
				else {
					var result = Math.round(data["RUB"]/data[currency] * 100) / 100;
				}
				let ms = "1 " + currency + ' = ' + result + ' ₽';
				bot.sendMessage(chatId, ms);
				});
		}	
});



bot.on("polling_error", (err) => console.log(err));

http.createServer().listen(process.env.PORT || 5000).on('request', 
function(req, res) { 
	res.end('');
 });
setInterval(function () { http.get('http://ybf-bot.herokuapp.com/'); }, 300000);