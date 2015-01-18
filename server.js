/****************************************************************
* Name : server.js
* Authors : Théo Chartier & Hugo des Longchamps
* Date : 08.01.2015
* Description : Server in nodeJS wich communicate with android client through socket.IO
*
*****************************************************************/


var mongoose = require('mongoose');

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '192.168.1.32'


console.log("Server running on " + process.env.OPENSHIFT_NODEJS_IP + " " + process.env.OPENSHIFT_NODEJS_PORT);
if (server_port == 3000){
	console.log("local db");
	mongoose.connect('mongodb://localhost/nodesocketapplication', function(err) {
		if (err) { throw err; }
	});
}
else{
	mongoose.connect('mongodb://admin:Yg5ZI42eV2Le@127.7.192.130/nodesocketapplication', function(err) {
		if (err) { throw err; }
	});
}
/*
var pictureSchema = new mongoose.Schema({
	coordId : Number,
	hikeId : Number,
	picture : String
});
*/
// Creating Schema for an hike
var hikeSchema = new mongoose.Schema({
  _id :  Number,
  hikeName: String,
  totalDistance: Number,
  totalTime:  Number

});

var locationSchema = new mongoose.Schema({
	_id : Number,
	hikeId : Number,
	longitude :  Number,
    latitude :  Number,
    picture: String,
    comment : String


});




// Creating model for an hike
var hikeModel = mongoose.model('hikes', hikeSchema);

// Creating model for a location
var locationModel = mongoose.model('locations', locationSchema);



/********************************************************
* MODELS USED TO SEND DATA
*********************************************************/
function HikeToSend(id,hikeName,totalDistance,totalTime){
	this.id = id;
	this.hikeName = hikeName;
	this.totalDistance = totalDistance;
	this.totalTime = totalTime;
}

function LocationToSend(id,hikeId,longitude,latitude,picture,comment){
	this.id = id;
	this.hikeId = hikeId;
	this.longitude = longitude;
	this.latitude = latitude;
	this.picture = picture;
	this.comment = comment;
}

function PictureToSend(coordId,hikeId,picture){
	this.coordId = coordId;
	this.hikeId = hikeId;
	this.picture = picture;
}

/********************************************************
* USED FOR TEST ONLY
*********************************************************/

/*
var hikeToAdd = new hikeModel();
		hikeToAdd._id = 1;
		hikeToAdd.hikeName = "First hike";
		hikeToAdd.totalDistance = 2;
		hikeToAdd.totalTime = 3;
		hikeToAdd.save(function (err) {
			if (err) { throw err; }
			console.log('Hike added with succes!');
			// We close the connection from the database
	//		mongoose.connection.close();

		});

var locationToAdd = new locationModel();
locationToAdd._id = 1;
locationToAdd.hikeId = 1;
locationToAdd.longitude = 5;
locationToAdd.latitude = 4;
locationToAdd.save(function (err){
	if (err) {
		throw err;
	}
	console.log("Location added with succes");
});

var locationToAdd = new locationModel();
locationToAdd._id = 2;
locationToAdd.hikeId = 1;
locationToAdd.longitude = 3;
locationToAdd.latitude = 5;
locationToAdd.save(function (err){
	if (err) {
		throw err;
	}
	console.log("Location added with succes");
});*/
/********************************************************
* MANAGE IO CONNECTION
*********************************************************/

 

var server = require('http').Server();
var io = require('socket.io')(server);
io.on('connection', function(socket){
	console.log(" a user connected");
  socket.on('message', function(data){
    console.log("Received message : "+data);
    socket.emit("message","echoing back : "+data);
  });


  //GET DB
    	socket.on('set_db', function (data){
        console.log('on set_db');
  		var queryLocation = locationModel.find(null);
     queryLocation.exec(function (err, locations){
     	if(err) {
     		console.log(err);
     	}
     	if(locations != null){
	     	for(var i=0;i<locations.length;i++){
	     		
	     		var locationToSend = new LocationToSend(locations[i].id,locations[i].hikeId,locations[i].longitude,locations[i].latitude,locations[i].picture,locations[i].comment);
	     		console.log(locationToSend);
	     		socket.emit('get_location', locationToSend);
	     		
	     	}
     	}
     });
	 var query = hikeModel.find(null);
	query.exec(function (err, hikes) {
	 if (err) { console.log(err); }

	// console.log(hikes);
		if (hikes != null){
			for (var i=0;i<hikes.length;i++)
			{
			/*	var hikeToSend ={
					id: hikes[i].id,
					name: hikes[i].name,
					totalDistance: hikes[i].totalDistance,
					totalTime: hikes[i].totalTime
				};*/
				var hikeToSend = new HikeToSend(hikes[i].id,hikes[i].hikeName,hikes[i].totalDistance,hikes[i].totalTime);
				socket.emit('get_db',hikeToSend);
				console.log(hikes[i]);
			}
		}

	});

  	});

  socket.on('get_picture_for_id', function (data){
  	var id = data.id;
  	var query = pictureModel.find({'hikeId' : id});
  	 query.exec(function (err,pictures){
  		if (err){
  			console.log("couldnt retrieve pictures");
  		}
  		else{
  			console.log("I RETRIEVE");
  			if (pictures != null){
  				for (var i=0;i<pictures.length;i++){
  					var pictureToSend = new PictureToSend(pictures[i].coordId,pictures[i].hikeId,pictures[i].picture);
  					socket.emit('set_picture', pictureToSend);
  				}
  			}
  			console.log(pictures);
  		}
  	});
  	});
 
	

  socket.on('add_picture', function (data){

  	console.log(data);
  	var pictureToAdd = new pictureModel();
  	pictureToAdd.coordId = data.coordId;
  	pictureToAdd.hikeId = data.hikeId;
  	pictureToAdd.picture = data.picture;
  	pictureToAdd.save(function (err){
  		if (err){
  			console.log('error while saving picture');
  		}
  		else
  		{
  			console.log('picture added with succes');
  		}
  	});
 // 	socket.emit('test_picture',data);
  });
  socket.on('add_location', function (data){

      	var locationToAdd = new locationModel();
  	locationToAdd._id = data.id;
  	locationToAdd.hikeId = data.hikeId;
  	locationToAdd.longitude = data.longitude;
  	locationToAdd.latitude = data.latitude;
  	locationToAdd.picture = data.picture;
  	locationToAdd.comment = data.comment;
  	locationToAdd.save(function (err ) {
  		if (err ) { throw err; }
        console.log("data - " + data.latitude + data.longitude );
        console.log("locationToAdd - " + locationToAdd.latitude)

  		console.log(' location added with succes');
  	//	mongoose.connection.close();
  	});


  });



  //listener for the event add_db
  socket.on('add_db', function (data) {

  		var hikeToAdd = new hikeModel();
		hikeToAdd._id = data.id;
		hikeToAdd.hikeName = data.hikeName;
		hikeToAdd.totalDistance = data.totalDistance;
		hikeToAdd.totalTime = data.totalTime;
		hikeToAdd.save(function (err) {
			if (err) { throw err; }
			console.log('Hike added with succes!');
			// We close the connection from the database
	//		mongoose.connection.close();

		});

  });
  socket.on('disconnect', function(){
    // client disconnected
   });
});
server.listen(server_port,server_ip_address);
