var net = require('net');
var http = require('http');
var dgram = require('dgram');
Port = 11001;
var contactsAddress = [{host:'127.0.0.1', port:11002},{host:'127.0.0.1', port:11003}];
var connects = [];
var peers = [];
var isMaster = false;
var bigBrotherFail = false;
var followSucceed = false;
var vectorClock = [0,0,0];



function createConnect(n){

    connects[n]= net.createConnection({port: contactsAddress[n].port, host: contactsAddress[n].host}, function(){

        console.log("Connection to "+contactsAddress[n].host+":"+contactsAddress[n].port+" success.");
        connects[n].write(JSON.stringify({status: "alive", sender: Port, vector : vectorClock}));



    });

    connects[n].on('error', function(err){

        console.log("error occur on socket "+n);

        connects[n].destroy();

        connects[n] = undefined;

    });

    connects[n].on('data', function(data){
        var msg = JSON.parse(data);
        if(n == 0){
            if("change" in msg){

            }
            if("succeed" in msg && bigBrotherFail == true){
                followSucceed = true;
                console.log("follow succeed");

            }
        }

    });

    connects[n].on('close', function(){

        console.log("socket closed "+n);
        connects[n] = undefined;
        if(n == 1){
            try{
                bigBrotherFail = true;
                connects[0].write(JSON.stringify({change:1}));

            }
            catch(e){

            }
        }
        if(n ==0){
            followSucceed = false;
        }




    });


}

var masterServer = net.createServer(function(socket){

    socket.on('data', function(data){
        var msg = JSON.parse(data);
        if('sender' in msg){
            socket.nickname =  {address: socket.remoteAddress, port: msg.sender};
            peers.push(socket);
            isMaster = true;

        }

    });

    socket.on('end' , function(err){

        peers.splice(peers.indexOf(socket),1);
        if(peers.length == 0){
            isMaster = false;

        }



    });





});

masterServer.listen(Port, function(){

    console.log("Server 11001 is listening");
    if(contactsAddress.length>0){
        vectorClock[0]+= 1;

    }
    for(var i=0; i<contactsAddress.length;i++){
        createConnect(i);

    }


});

masterServer.on('error', function(err){

    console.log("Error on server "+Port+err);

});

masterServer.on('data', function(data){


});


