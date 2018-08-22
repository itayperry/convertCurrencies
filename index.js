var express = require('express')
var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient;
var bodyParser = require('body-parser');
var connectionPromise = MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true }); // it's a promise
url = require('url');  
var app = express();
app.use(bodyParser.json());

app.get('/currencies/all', (req, res) => {
	var db = req.app.get('db')
	db.collection('currencyType').find().toArray()
	.then(data => {
	res.json(data)
	})
})

//convert: example - http://localhost:3000/currency?from=USD&to=ILS&amount=20
app.get('/currency', (req, res) => {
	var {from, to, amount} = req.query;
	var getRate = currency => db.collection('currencyType')
		.find(
			{
				name: currency
			},
			{
				fields: 
					{
						rate: 1, _id: 0
					}
			}
		).toArray();

	Promise.all([from, to].map(getRate)) // [fromPromise, toPromise]
	.then(data => {
		var body = ((data[0][0].rate / data[1][0].rate) * Number(amount)).toString();
		res.send('The result of the convert is ' + body);
	})
})

function updateSingleCurrency() {
	var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
	var FiveToSevenPercentChange = ( plusOrMinus * (( Math.random() * 2 ) + 5) / 10) + 1;
	var randonCurrency = db.collection('currencyType').aggregate(
    	[ 
    		{ 
       			$match:
		            {  name: 
		                { $nin: ['EUR'] } 
		            },
    		},
    		{ 
       			$sample: { size: 1 } 
    		}
   		]
	).toArray()
	//the $nin for EUR - not getting the base! this will corrupt all currency data
    randonCurrency.then(data =>
		db.collection('currencyType').updateOne(
			{ name: data[0].name }, 
			{ $mul: { 
				rate: FiveToSevenPercentChange
			} 
		})
    )
}

connectionPromise.then(connection => {
	db = connection.db('currencies')	
	app.set('db', db)		
	app.listen('3000', () => {
		setInterval(function(){ 
			updateSingleCurrency()
			console.log("Currencies' rates update every 2 seconds"); 
		}, 2000);
		console.log('listen')
	})
}).catch(err => console.error(err));