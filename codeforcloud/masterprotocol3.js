var net = require('net');
var http = require('http');
var dgram = require('dgram');
Port = 11003;
var contactsAddress = [];
var connects = [];
var peers = [];
var isMaster = false;
var vectorClock=[0, 0, 0];


function createConnect(n){

        connects[n]= net.createConnection({port: contactsAddress[n].port, host: contactsAddress[n].host}, function(){

            console.log("Connection to "+contactsAddress[n].host+":"+contactsAddress[n].port+" success.");
            connects[n].write(JSON.stringify({status: "alive", sender: Port}));


        });

        connects[n].on('error', function(err){

            console.log("error occur on socket "+n);

            connects[n].destroy();

            connects[n] = undefined;

        });

        connects[n].on('data', function(data){

        });

        connects[n].on('close', function(){

            console.log("socket closed "+n);
            connects[n] = undefined;


        });



}

var masterServer = net.createServer(function(socket){

    socket.on('data', function(data){
        var msg = JSON.parse(data);
        if('sender' in msg){
            socket.nickname = {address: socket.remoteAddress, port: msg.sender};
            console.log(msg.sender+ " in.")
            peers.push(socket);
            isMaster = true;
            console.log("mastering");

        }

    });

    socket.on('end' , function(err){

        peers.splice(peers.indexOf(socket),1);
        if(peers.length == 0){
            isMaster = false;
            console.log("not mastering");

        }

    });





});

masterServer.listen(Port, function(){

    console.log("Server "+Port+" is listening");
    for(var i=0; i<contactsAddress.length;i++){
        createConnect(i);
    }


});

masterServer.on('error', function(err){

    console.log("Error on server "+Port+err);

});

masterServer.on('data', function(data){


});
