var net = require('net');
var tcpconnections=new Array();
var webconnections=null;
var http = require('http');
var webSocketServer = require("websocket").server;
var Connections={};
var leaderAddress;


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

httpServer.listen(9002, function() { console.log("Listening for connections on port 9001"); });

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

    //console.log(request)
    Connection.on('message', function(message){
        jMessage=JSON.parse(message.utf8Data);
        if("coco" in jMessage){
            if (leaderAddress){Connection.sendUTF(JSON.stringify({redirect: leaderAddress}));}


        }
        else if("roro" in jMessage){
            Connection.sendUTF(JSON.stringify({reconnect: leaderAddress}));

        }

    });

    Connection.on('close', function(){



    });



});




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

    connectionListener.on('data', function(tcpMessage){
        var tMessage=JSON.parse(tcpMessage);
        if("serverAd" in tMessage && "rank" in tMessage){
            var podex = tcpconnections.push({worker:connectionListener, address:tMessage.serverAd});
            console.log("Connections count "+podex);
            connectionListener.write(JSON.stringify({"rank": podex})+'\n');



        }
        else if("serverAd" in tMessage){
            var podex = tcpconnections.push({worker:connectionListener, address:tMessage.serverAd});
            console.log("Connections count "+podex);
            connectionListener.write(JSON.stringify({"rank": podex})+'\n');


        }


    });

    connectionListener.on('close', function(){});

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

    //Write to the connected socket
    //connectionListener.write('heyyo\r\n');

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
server.listen(8182, function() {
    console.log('server is listening');
});

function reset(){
    for(var i=0; i<tcpconnections.length; i++){
        var temp=i+1;
        tcpconnections[i].worker.write(JSON.stringify({"rank": temp})+'\n');
    }
}

setInterval(function(){
    try{
        leaderAddress = tcpconnections[0].address;

    }
    catch (e){

    }



},40);

function dumpToDisk(){
    memcached.items( function( err, result ){
        if( err ) console.error( err );

        // for each server...
        result.forEach(function( itemSet ){
            var keys = Object.keys( itemSet );
            keys.pop(); // we don't need the "server" key, but the other indicate the slab id's

            keys.forEach(function( stats ){

                // get a cachedump for each slabid and slab.number
                memcached.cachedump( itemSet.server, stats, itemSet[stats].number, function( err, response ){
                    // dump the shizzle
                    console.info( JSON.stringify( response ) );
                    console.log( response.key );
                })
            })
        })
    });
}