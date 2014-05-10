var net = require('net');
var http = require('http');
var dgram = require('dgram');
Port = 11002;
var contactsAddress = [{host:'127.0.0.1', port:11003}];
var connects = [];
var peers = [];
var isMaster = false;
var bigBrotherFail = false;
var agreeOnFail = false;
var vectorClock=[0,0,0];
//var followSucceed = false;


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
        if(n ==0){bigBrotherFail = true;}

        if (bigBrotherFail== true && agreeOnFail == true && peers.length>0){
            isMaster = true;
            console.log("Mastering");
            peers[0].write(JSON.stringify({succeed:1}));
        }
        /*
        bigBrotherFail = true;
        if(n ==0){
            if(peers[0]){
                try{
                    peers[0].write(JSON.stringify({change: 1}));
                }
                catch(e){

                }
            }

        } */

    });


}

var masterServer = net.createServer(function(socket){

    socket.on('data', function(data){
        var msg = JSON.parse(data);
        if('sender' in msg){
            socket.nickname = {address: socket.remoteAddress, port: msg.sender};
            peers.push(socket);

        }
        if('change' in msg){
            agreeOnFail = true;
            if(bigBrotherFail){
                isMaster= true;
                peers[0].write(JSON.stringify({succeed:1}));
                console.log("Mastering");
            }

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

    console.log("Server" + Port + " is listening");
    for(var i=0; i<contactsAddress.length;i++){
        createConnect(i);
    }


});

masterServer.on('error', function(err){

    console.log("Error on server "+Port+err);

});

masterServer.on('data', function(data){


});