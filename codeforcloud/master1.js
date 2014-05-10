var net = require('net');
var tcpconnections=new Array();
var webconnections=null;
var http = require('http');
var webSocketServer = require("websocket").server;
var Connections={};
var leaderAddress;
var leaderPort;


Array.prototype.remove = function(e) {
  for (var i = 0; i < this.length; i++) {
    if (e == this[i]) { this.splice(i, 1); console.log("It is "+i); return;}
  }
};
Array.prototype.removeByTcp= function(e) {
    for (var i = 0; i< this.length; i++){
        if (e == this[i].worker){
            this.splice(i, 1);
            console.log("It is  "+i);
            return;
        }
    }
};

var httpServer = http.createServer(
    function(Request, Response)
    {
        Response.writeHead(200, { "Content-Type": "text/plain" });
        Response.end();
    }
);

httpServer.listen(9001, function() { console.log("Listening for connections on port 9001"); });
//The websocket server is for connections between clients and masters
var webServer = new webSocketServer(
    {
        httpServer: httpServer,
        closeTimeout: 2000
    }
);

webServer.on('request', function(request){

    var Connection = request.accept(null, request.origin);
    Connection.IP = request.remoteAddress;
    var id =""+request.key;
    id=id+Connection.IP;
    Connections[id] = Connection;
    console.log(id);

    //When clients request to connect to the gamen server, feed them back with the right one
    Connection.on('message', function(message){
        jMessage=JSON.parse(message.utf8Data);
        if("coco" in jMessage){
            if (leaderAddress){Connection.sendUTF(JSON.stringify({redirect: leaderAddress, redirectPort: leaderPort}));}


        }
        else if("roro" in jMessage){
            if(leaderAddress){Connection.sendUTF(JSON.stringify({reconnect: leaderAddress, reconnectPort: leaderPort}));}

        }

    });

    Connection.on('close', function(){


    });



});



//This is the TCP server for connections between master and workers
var server = net.createServer(function(connectionListener) {
	var that= this;
    console.log('connected');
    //Get the configured address for the server
    console.log(this.address());
        //get connections takes callback function
    this.getConnections(function(err, count) {
        if (err) {
            console.log('Error getting connections');
        } else {
            //console.log('Connections count: ' + count);
            //connectionListener.write(JSON.stringify({"rank": count})+'\n');
            //tcpconnections[count-1]=connectionListener;
            //console.log(connectionListener.remoteAddress);
            //console.log(connectionListener);
		} 
	});
    connectionListener.on('end', function() {
        console.log('disconnected');
        that.getConnections(function(err, count) {
        	if (err) {
            	console.log('Error getting connections');
        	} else {
            	//console.log('Connections count: ' + count);
                console.log("end");
            	tcpconnections.removeByTcp(connectionListener);
                console.log(tcpconnections.length);
            	connectionListener.end();
            	reset();
			}

		});

    });
    //When workers request to join the group, put them at the end of the que and give them their rank in the que
    connectionListener.on('data', function(tcpMessage){
        var tMessage=JSON.parse(tcpMessage);
        if("serverAd" in tMessage && "rank" in tMessage){
            var podex = tcpconnections.push({worker:connectionListener, address:tMessage.serverAd, port: tMessage.serverPt});
            console.log("Connections count "+podex);
            connectionListener.write(JSON.stringify({"rank": podex})+'\n');



        }
        else if("serverAd" in tMessage){
            var podex = tcpconnections.push({worker:connectionListener, address:tMessage.serverAd, port: tMessage.serverPt});
            console.log("Connections count "+podex);
            connectionListener.write(JSON.stringify({"rank": podex})+'\n');


        }


    });
	
	connectionListener.on('close', function(){});
	// Dealing withe error between master and worker like disconnection
	connectionListener.on('error', function() {
        console.log('disconnected');
        that.getConnections(function(err, count) {
        	if (err) {
            	console.log('Error getting connections');
        	} else {
            	console.log('Connections count: ' + count);
            	tcpconnections.removeByTcp(connectionListener);
            	connectionListener.end();
            	reset();
			}

		});

    });

    
	
});
server.on('error', function(err) {
    console.log('Server error: ' + err);
});
server.on('data', function(data) {
	console.log("inconming states");
    webconnections=JSON.parse(data).connects;
    for(var i=1; i<tcpconnections.length;i++){
    	tcpconnections[i].write(JSON.stringify({"connects": webconnections})+'\n')
    }
});
/**
* listen()
*/
server.listen(8181, function() {
    console.log('server is listening');
});
// Give workers back their ranks in the group when changes happen in workers
function reset(){
	for(var i=0; i<tcpconnections.length; i++){
			var temp=i+1;
			tcpconnections[i].worker.write(JSON.stringify({"rank": temp})+'\n');
	}
}

setInterval(function(){
    try{
        leaderAddress = tcpconnections[0].address;
        leaderPort = tcpconnections[0].port;

    }
    catch (e){

    }



},40);

