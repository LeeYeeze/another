var net = require('net');
var tcpconnections=new Array();
var webconnections=null;
var Memcached = require('memcached');
var memcached = new Memcached('localhost:11211');

Array.prototype.remove = function(e) {
  for (var i = 0; i < this.length; i++) {
    if (e == this[i]) { this.splice(i, 1); console.log("It is "+i); return;}
  }
};


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
            console.log('Connections count: ' + count);
            connectionListener.write(JSON.stringify({"rank": count})+'\n');
            tcpconnections[count-1]=connectionListener;
		} 
	});
    connectionListener.on('end', function() {
        console.log('disconnected');
        that.getConnections(function(err, count) {
        	if (err) {
            	console.log('Error getting connections');
        	} else {
            	console.log('Connections count: ' + count);
            	tcpconnections.remove(connectionListener);
            	connectionListener.end();
            	reset();
			}

		});

    }); 
	
	connectionListener.on('close', function(){});
	
	connectionListener.on('error', function() {
        console.log('disconnected');
        that.getConnections(function(err, count) {
        	if (err) {
            	console.log('Error getting connections');
        	} else {
            	console.log('Connections count: ' + count);
            	tcpconnections.remove(connectionListener);
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
    	tcpconnection[i].write(JSON.stringify({"connects": webconnections})+'\n')
    }
});
/**
* listen()
*/
server.listen(8181, function() {
    console.log('server is listening');
});

function reset(){
	for(var i=0; i<tcpconnections.length; i++){
			var temp=i+1;
			tcpconnections[i].write(JSON.stringify({"rank": temp})+'\n');
	}
}

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