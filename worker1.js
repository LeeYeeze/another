var os = require('os');
var ifaces=os.networkInterfaces();
var net = require('net');
var HTTP = require("http");
var WebSocketServer = require("websocket").server;
var Game = require("./game.js");
var fs = require('fs');
var port=8001;

var mongoose = require('mongoose');
var mongoDB = require('mongodb').Db;
var mongoServer = require('mongodb').Server;

var db1 = new mongoDB('test1', new mongoServer('10.32.106.222', 27017));
db1.on('error', console.error.bind(console, 'connection error:'));
db1.once('open', function callback () {});

var db2 = new mongoDB('test2', new mongoServer('10.32.37.76', 27017));
db2.on('error', console.error.bind(console, 'connection error:'));
db2.once('open', function callback () {});

var db3 = new mongoDB('test3', new mongoServer('10.32.37.76', 27017));
db3.on('error', console.error.bind(console, 'connection error:'));
db3.once('open', function callback () {});

var conn1good=1;
var conn2good=1;
var conn3good=1;
var options = { server: { socketOptions: { connectTimeoutMS: 3000 }}};
var conn1 = mongoose.createConnection('mongodb://10.32.106.222/test1',options);
conn1.on('error',function(err){
	if(err)
	{
		conn1good=0;
		console.log("conn1 createConnection error!");
		conn1.db.close();
	}
});
var conn2 = mongoose.createConnection('mongodb://10.32.37.76/test2',options);
conn2.on('error',function(err){
	if(err)
	{
		conn2good=0;
		console.log("conn2 createConnection error!");
		conn2.db.close();
	}
});
var conn3 = mongoose.createConnection('mongodb://10.32.37.76/test3',options);
conn3.on('error',function(err){
	if(err)
	{
		conn3good=0;
		console.log("conn3 createConnection error!");
		conn3.db.close();
	}
});

var playerSchema = mongoose.Schema({
	    Name: String,
	    GameRecords: Number,
		X: Number,
        Y: Number,
        VX: Number,
        VY: Number,
        OR: Number,
        humanzombie: Number,
        alive: Number,
        distance: Number
		});
//var player = mongoose.model('player', playerSchema);
var player1 = conn1.model('player', playerSchema);
var player2 = conn2.model('player', playerSchema);
var player3 = conn3.model('player', playerSchema);

var myRank = 0;
var mastersArray =[{"port":8181, "host":'10.33.137.127'},{"port":8182, "host":'10.33.137.127'},{"port":8183, "host":'10.33.137.127'}];
var Frame = 0;
var FramesPerGameStateTransmission = 3;
var MaxConnections = 10;
var Connections = {};
var HTTPServer = HTTP.createServer(
			function(Request, Response)
			{
				Response.writeHead(200, { "Content-Type": "text/plain" });
				Response.end();
			}
			);
// createConnection
ifaces['无线网络连接'].forEach(function(details){

    if(details.family=='IPv4'){
        console.log(details.address);
        setupWorkerMasterRelation(details,0);



    }
});


function setupWorkerMasterRelation(details, tracker){
    tracker= tracker%mastersArray.length;
    var tcpConnection = net.createConnection({port: mastersArray[tracker].port, host: mastersArray[tracker].host},
// connectListener callback
        function() {
            console.log('connection successful');
            //tcpConnection.write();
            if(myRank==1){
                tcpConnection.write(JSON.stringify({serverAd: details.address, rank:1}));


            }
            else{
                tcpConnection.write(JSON.stringify({serverAd: details.address}));

            }




        });

    tcpConnection.on('data', function(data){
        //TODO: A bug need to be fixed here
        var message= JSON.parse(data);
        if("rank" in message){
            console.log(message.rank);

            if(message.rank==1&&myRank!=1){
                setupGameServer();
            }
            myRank=message.rank;
        }
        else if("connects" in message){
            Connections=message.connects;
            console.log("new state");
        }
    });

    tcpConnection.on('error', function(){
        console.log("Something bad happened");

    });


    tcpConnection.on('close', function(){
        console.log("Something bad happened 2");
        setupWorkerMasterRelation(details, tracker+1);



    });

}



function setupGameServer(){
	HTTPServer.listen(port, function() { console.log("Listening for connections on port "+port); });

// Creates a WebSocketServer using the HTTP server just created.
var Server = new WebSocketServer(
			{
				httpServer: HTTPServer,
				closeTimeout: 2000
			}
			);

Server.on("request",
			function(Request)
			{
				if (ObjectSize(Connections) >= MaxConnections)
				{
					Request.reject();
					return;
				}
				
				var Connection = Request.accept(null, Request.origin);
				Connection.IP = Request.remoteAddress;
				
				// Assign a random ID that hasn't already been taken.
				do { Connection.ID = Math.floor(Math.random() * 100000) } while (Connection.ID in Connections);
				Connections[Connection.ID] = Connection;
				
				Connection.on("message",
					function(Message)
					{
						// All of our messages will be transmitted as unicode text.
						if (Message.type == "utf8")
							HandleClientMessage(Connection.ID, Message.utf8Data);
					}
					);
					
				Connection.on("close",
					function()
					{
						HandleClientClosure(Connection.ID);
					}
					);
				
				console.log("Logged in " + Connection.IP + "; currently " + ObjectSize(Connections) + " users.");
			}
			);
			
function HandleClientClosure(ID)
{
	if (ID in Connections)
	{
		console.log("Disconnect from " + Connections[ID].IP);
		delete Connections[ID];
	}
}

function HandleClientMessage(ID, Message)
{
	// Check that we know this client ID and that the message is in a format we expect.
	if (!(ID in Connections)) {console.log("ID not in");return;}
	
	try { Message = JSON.parse(Message); }
	catch (Err) { return; }
	if (!("Type" in Message && "Data" in Message)) {console.log("wrong type");return;}
	
	// Handle the different types of messages we expect.
	var C = Connections[ID];
	switch (Message.Type)
	{
		// Handshake.
		case "HI":

            if(conn1good==1)
			{
				player1.findOne({ Name:Message.Data.toString().substring(0, 10) },function(err, theCar){
					if(err)
					{
						console.log("Mongodb Error!");
					}
					else
					{
						if (!theCar)
						{
							spawn(C, Message, 1, 0);
						}
						else
						{
							D = theCar.distance;
							spawn(C, Message, 0, D);
						}
					}
				});
			}
			else
			{
				if(conn2good==1)
				{
					player2.findOne({ Name:Message.Data.toString().substring(0, 10) },function(err, theCar){
						if(err)
						{
							console.log("Mongodb Error!");
						}
						else
						{
							if (!theCar)
							{
								spawn(C, Message, 1, 0);
							}
							else
							{
								D = theCar.distance;
								spawn(C, Message, 0, D);
							}
						}
					});
				}
				else
				{
					if(conn3good==1)
					{
						player1.findOne({ Name:Message.Data.toString().substring(0, 10) },function(err, theCar){
							if(err)
							{
								console.log("Mongodb Error!");
							}
							else
							{
								if (!theCar)
								{
									spawn(C, Message, 1, 0);
								}
								else
								{
									D = theCar.distance;
									spawn(C, Message, 0, D);
								}
							}
						});
					}
				}
			}
			break;
			
		// Key up.
		case "U":
			if (typeof C.KeysPressed === "undefined") break;
			
			//if (Message.Data == 37) C.KeysPressed &= ~2; // Left
			//else if (Message.Data == 39) C.KeysPressed &= ~4; // Right
			//else if (Message.Data == 38) C.KeysPressed &= ~1; // Up
			C.KeysPressed=0;
			break;

			
		// Key down.
		case "D":
			if (typeof C.KeysPressed === "undefined") break;
			
			//if (Message.Data == 37) C.KeysPressed |= 2; // Left
			//else if (Message.Data == 39) C.KeysPressed |= 4; // Right
			//else if (Message.Data == 38) C.KeysPressed |= 1; // Up
			C.KeysPressed=Message.Data;
			break;
	}
}

function spawn(C, Message, type){
    if (C.Car) return;
    if(type==1){
        C.Car =
        {
            X: Math.random() * (320-50),
            Y: Math.random() * (480-100),
            VX: 0,
            VY: 0,
            OR: 0,
            // Put a reasonable length restriction on usernames, which will be displayed to all players.
            Name: Message.Data.toString().substring(0, 10),
            // Flag for this player being human or zombie
            humanzombie: Math.floor(Math.random() * 2),
            // Flag for this player being alive or not
            alive: 1,//Math.floor(Math.random() * 2)
            distance:0
        };
        C.KeysPressed=0;
        UpdateDB(C.Car);

    }
    else{
        if("Details" in Message){
            C.Car=Message.Details;
            C.Car.Name= Message.Data.toString().substring(0, 10);
            C.KeysPressed=0;
            //RetrieveDB(C.Car);
			console.log("Start findOne!");
			if(conn1good==1)
			{
				player1.findOne({ Name:C.Car.Name },function(err, oldplayer){
					if (err){
						console.log("Mongodb player1 findOne error!");
					}
					else
					{
						if(!oldplayer)
						{
							
						}
						else
						{
							C.Car.X = oldplayer.X;
							C.Car.Y = oldplayer.Y;
							C.Car.VX = oldplayer.VX;
							C.Car.VY = oldplayer.VY;
							C.Car.OR = oldplayer.OR;
							C.Car.humanzombie = oldplayer.humanzombie;
							C.Car.alive = oldplayer.alive;
							C.Car.distance = oldplayer.distance;
							console.log("Data retrieved!" );
						}				
					}	
				});
			}
			else
			{
				if(conn2good==1)
				{
					player2.findOne({ Name:C.Car.Name },function(err, oldplayer){
						if (err){
							console.log("Mongodb player2 findOne error!");
						}
						else
						{
							if(!oldplayer)
							{
								
							}
							else
							{
								C.Car.X = oldplayer.X;
								C.Car.Y = oldplayer.Y;
								C.Car.VX = oldplayer.VX;
								C.Car.VY = oldplayer.VY;
								C.Car.OR = oldplayer.OR;
								C.Car.humanzombie = oldplayer.humanzombie;
								C.Car.alive = oldplayer.alive;
								C.Car.distance = oldplayer.distance;
								console.log("Data retrieved!" );
							}				
						}	
					});
				}
				else
				{
					if(conn3good==1)
					{
						player3.findOne({ Name:C.Car.Name },function(err, oldplayer){
							if (err){
								console.log("Mongodb player2 findOne error!");
							}
							else
							{
								if(!oldplayer)
								{
									
								}
								else
								{
									C.Car.X = oldplayer.X;
									C.Car.Y = oldplayer.Y;
									C.Car.VX = oldplayer.VX;
									C.Car.VY = oldplayer.VY;
									C.Car.OR = oldplayer.OR;
									C.Car.humanzombie = oldplayer.humanzombie;
									C.Car.alive = oldplayer.alive;
									C.Car.distance = oldplayer.distance;
									console.log("Data retrieved!" );
								}				
							}	
						});
					}
				}
			}
        }
        else{
			//retrieveById(Message.Data.toString().substring(0, 10),C);
			C.Car =
			{
				X: Math.random() * (320-50),
				Y: Math.random() * (480-100),
				VX: 0,
				VY: 0,
				OR: 0,
				// Put a reasonable length restriction on usernames, which will be displayed to all players.
				Name: Message.Data.toString().substring(0, 10),
				// Flag for this player being human or zombie
				humanzombie: Math.floor(Math.random() * 2),
				// Flag for this player being alive or not
				alive: 1,//Math.floor(Math.random() * 2)
				distance: D
			};
			C.KeysPressed=0;
			UpdateDB(C.Car);
        }

    }

}

function UpdateDB(oneCar)
{
	if(conn1good==1)
	{
		player1.findOne({ Name:oneCar.Name },function(err, oldplayer){
			if (err){
				console.log("Mongodb findOne error!");
			}
			else
			{
				if(!oldplayer)
				{
					var onePlayer = new player1({ 
						Name: oneCar.Name,
						GameRecords: 1,
						X: oneCar.X,
						Y: oneCar.Y,
						VX: oneCar.VX,
						VY: oneCar.VY,
						OR: oneCar.OR,
						humanzombie: oneCar.humanzombie,
						alive: oneCar.alive,
						distance: oneCar.distance
					})	
					onePlayer.save(function(err){
						if (err)	
							return console.error(err);
					})
				}
				else
				{
					oldplayer.X = oneCar.X;
					oldplayer.Y = oneCar.Y;
					oldplayer.VX = oneCar.VX;
					oldplayer.VY = oneCar.VY;
					oldplayer.OR = oneCar.OR;
					oldplayer.humanzombie = oneCar.humanzombie;
					oldplayer.alive = oneCar.alive;
					oldplayer.distance = oneCar.distance;
					oldplayer.save(function(err){
						if (err)	
							return console.error(err);
					})
				}				
			}	
		});
	}
	if(conn2good==1)
	{
		player2.findOne({ Name:oneCar.Name },function(err, oldplayer){
			if (err){
				console.log("Mongodb findOne error!");
			}
			else
			{
				if(!oldplayer)
				{
					var onePlayer = new player2({ 
						Name: oneCar.Name,
						GameRecords: 1,
						X: oneCar.X,
						Y: oneCar.Y,
						VX: oneCar.VX,
						VY: oneCar.VY,
						OR: oneCar.OR,
						humanzombie: oneCar.humanzombie,
						alive: oneCar.alive,
						distance: oneCar.distance
					})	
					onePlayer.save(function(err){
						if (err)	
							return console.error(err);
					})
				}
				else
				{
					oldplayer.X = oneCar.X;
					oldplayer.Y = oneCar.Y;
					oldplayer.VX = oneCar.VX;
					oldplayer.VY = oneCar.VY;
					oldplayer.OR = oneCar.OR;
					oldplayer.humanzombie = oneCar.humanzombie;
					oldplayer.alive = oneCar.alive;
					oldplayer.distance = oneCar.distance;
					oldplayer.save(function(err){
						if (err)	
							return console.error(err);
					})
				}				
			}	
		});
	}
	if(conn3good==1)
	{
		player3.findOne({ Name:oneCar.Name },function(err, oldplayer){
			if (err){
				console.log("Mongodb findOne error!");
			}
			else
			{
				if(!oldplayer)
				{
					var onePlayer = new player3({ 
						Name: oneCar.Name,
						GameRecords: 1,
						X: oneCar.X,
						Y: oneCar.Y,
						VX: oneCar.VX,
						VY: oneCar.VY,
						OR: oneCar.OR,
						humanzombie: oneCar.humanzombie,
						alive: oneCar.alive,
						distance: oneCar.distance
					})	
					onePlayer.save(function(err){
						if (err)	
							return console.error(err);
					})
				}
				else
				{
					oldplayer.X = oneCar.X;
					oldplayer.Y = oneCar.Y;
					oldplayer.VX = oneCar.VX;
					oldplayer.VY = oneCar.VY;
					oldplayer.OR = oneCar.OR;
					oldplayer.humanzombie = oneCar.humanzombie;
					oldplayer.alive = oneCar.alive;
					oldplayer.distance = oneCar.distance;
					oldplayer.save(function(err){
						if (err)	
							return console.error(err);
					})
				}				
			}	
		});
	}
}

function RetrieveDB(oneCar)
{
}

function retrieveById(id,C)
{
}

	 
function SendGameState()
{
	var CarData = [];
	var Indices = {};
	
	// Collect all the car objects to be sent out to the clients
	for (var ID in Connections)
	{
		// Some users may not have Car objects yet (if they haven't done the handshake)
		var C = Connections[ID];
		if (!C.Car) continue;
		
		CarData.push(C.Car);
		
		// Each user will be sent the same list of car objects, but needs to be able to pick
		// out his car from the pack. Here we take note of the index that belongs to him.
		Indices[ID] = CarData.length - 1;
	}
	//tcpConnection.write(JSON.stringify(Connections)+'\n');
	
	// Go through all of the connections and send them personalized messages. Each user gets
	// the list of all the cars, but also the index of his car in that list.
	for (var ID in Connections)
		Connections[ID].sendUTF(JSON.stringify({ MyIndex: Indices[ID], Cars: CarData }));
	//console.log(Connections);
}

// Set up game loop.
setInterval(function()
			{
				// Make a copy of the car data suitable for RunGameFrame.
				var Cars = [];
				for (var ID in Connections)
				{
					var C = Connections[ID];
					if (!C.Car) continue;
					
					Cars.push(C.Car);
				
					if (C.KeysPressed==37) {C.Car.OR =4; C.Car.VX=-1; C.Car.VY=0;}
					else if (C.KeysPressed==39) {C.Car.OR =6; C.Car.VX=1; C.Car.V=0;}
					else if (C.KeysPressed==38) {C.Car.OR =2; C.Car.VX=0; C.Car.VY=-1;}
					else if (C.KeysPressed==40) {C.Car.OR =0; C.Car.VX=0; C.Car.VY=1}
					else if (C.KeysPressed==32) 
					{
						C.Car.VX=0; C.Car.VY=0; 
						C.Car.firing=1;
						var hurtx1; var hurtx2; var hurty1; var hurty2;
						if(C.Car.OR == 4) {hurtx1 = C.Car.X-50; hurtx2 = C.Car.X; hurty1 = C.Car.Y; hurty2 = C.Car.Y+100;}
						else if(C.Car.OR == 6) {hurtx1 = C.Car.X+50; hurtx2 = C.Car.X+100; hurty1 = C.Car.Y; hurty2 = C.Car.Y+100;}
						else if(C.Car.OR == 2) {hurtx1 = C.Car.X; hurtx2 = C.Car.X+50; hurty1 = C.Car.Y-100; hurty2 = C.Car.Y;}
						else if(C.Car.OR == 0) {hurtx1 = C.Car.X; hurtx2 = C.Car.X+50; hurty1 = C.Car.Y+100; hurty2 = C.Car.Y+200;}
						
						if(C.Car.alive==1)
						{
							for (var ID in Connections)
							{
								var C2 = Connections[ID];
								var thiscarx = C2.Car.X + 25;
								var thiscary = C2.Car.Y + 50;
								if ((thiscarx>hurtx1) && (thiscarx<hurtx2) && (thiscary>hurty1) && (thiscary<hurty2) && (C.Car.humanzombie != C2.Car.humanzombie))
								{
									C2.Car.alive=0;
								}
							}
						}
					}
					else {C.Car.VX=0; C.Car.VY=0;C.Car.firing=0;}
				}
				
				Game.RunGameFrame(Cars);
				
				for (var ID in Connections)
				{
					var C = Connections[ID];
					if (!C.Car) continue;
					UpdateDB(C.Car);
				}

				// Increment the game frame, which is only used to time the SendGameState calls.
				Frame = (Frame + 1) % FramesPerGameStateTransmission;
				if (Frame == 0) SendGameState();
			},
			20
			);
			
function ObjectSize(Obj)
{
	var Size = 0;
	for (var Key in Obj)
		if (Obj.hasOwnProperty(Key))
			Size++;
			
	return Size;
}

function orderedSend(oneCar, index){
    if (index<memcachedcluster.length){
        memcachedcluster[index].set(oneCar.Name, {X: oneCar.X, Y: oneCar.Y, VX: oneCar.VX, VY: oneCar.VY, OR: oneCar.OR, humanzombie: oneCar.humanzombie, alive: oneCar.alive, distance: oneCar.distance}, lifetime, function( err, result ){
            if( err ) console.error( err );
            send(oneCar, index+1);

        });

    }




}

function send(oneCar){
    for (mem in memcachedcluster){
        mem.set(oneCar.Name, {X: oneCar.X, Y: oneCar.Y, VX: oneCar.VX, VY: oneCar.VY, OR: oneCar.OR, humanzombie: oneCar.humanzombie, alive: oneCar.alive, distance: oneCar.distance}, lifetime, function( err, result ){
            if( err ) console.error( err );
        });
    }
}

function safeSendOrdered(){




}

function safeSendQuick(){

}
}