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


                                
