var http=require("http");
var fs=require("fs");
var path=require("path");
var mime=require("mime");
var WebSocketServer = require("websocket").server;
var net=require("net");
var cache={};
var usercount;

function send404(response){
    response.writeHead(404,{'Content-Type':'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}

function sendFile(response, filePath, fileContents){
    response.writeHead(200,{'Content-Type': mime.lookup(path.basename(filePath))});
    response.end(fileContents);
}

function serveStatic(response, cache, absPath){
    if (cache[absPath]){
        sendFile(response, absPath, cache[absPath]);
    }else{
        fs.exists(absPath, function(exists){
            if(exists){
                fs.readFile(absPath, function(err, data){
                    if(err){
                        send404(response);
                    }else{
                        cache[absPath]= data;
                        sendFile(response, absPath, data);
                    }
                });
            }else{
                send404(response);
            }
        });
    }
}

var HTTPServer = http.createServer(
    function(request, response)
    {
        var filePath=false;
        if(request.url=='/1')
				{
//			userconunt=Math.random();
//			console.log(usercount);
//			console.log(Math.random());
//			if (usercount<0.5)
			//if(Math.random()<0.5)
			//{
				//filePath='index1.html';
			//}
			//else
			//{
				//filePath='index2.html';
			//}
			  	filePath='index1.html';
        }
				else if(request.url=='/2')
				{
					filePath='index2.html';
				}
				else
				{
            filePath=request.url;
      	}
        var absPath='./'+filePath;
        serveStatic(response, cache, absPath);
    }
);

// Starts the HTTP server on port 9001.
HTTPServer.listen(7001, function() { console.log("Listening for connections on port 7001"); });
