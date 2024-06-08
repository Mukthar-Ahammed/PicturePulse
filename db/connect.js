const mongoose = require('mongoose');

module.exports.connect = function(done) {
    const url = "mongodb://localhost:27017/movie";

    mongoose.connect(url)
        .then(() => {
            console.log("Connected to database");
            done();
        })
        .catch((err) => {
            console.log("Failed to connect to database: " + err);
            done(err);
        });
}

module.exports.get = function() {
    return mongoose.connection;
}

/*
  -> First loaded the mongoose module 
  -> created function connect to connect with the database
  ->This function is assigned to module.exports so that it can be accessed in other files
  ->This function connects to a MongoDB database and takes a callback function (done) as a parameter to indicate when the connection process is finished.  
  ->connected the mongodb using mongodb url 
  ->*/










/*const MongoClient = require('mongodb').MongoClient
const state={
    db:null 
}
module.exports.connect=function(done){         
   const url="mongodb://localhost:27017/movie";      
   const dbName="movie";

MongoClient.connect(url)
    .then(() => {
        console.log("Connected to database");
        done();
    })
    .catch((err) => {
        console.log("Failed to connect to database: " + err);
        done(err);
    });
}

module.exports.get=function(){
    return state.db
}*/



                                
