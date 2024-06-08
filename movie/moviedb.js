/*var db=require('../db/connect')
//The functions written in the module.exports can be accessed in other files  
module.exports={
    addmovie:(movies,callback)=>{
        console.log(movies)
        db.get().collection('movies').insertOne(movies).then((data)=>{
           callback(true);
        }).catch((err) => {
            console.error('Error inserting movie:', err);
            callback(false);
        });
    }
}*/

const mongoose = require('mongoose');

// Define the Movie schema
const movieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    genere: {
        type: String,
        required: true
    },
    poster: {
        type: String,
        required: false
    }
});

// Create the Movie model
const Movie = mongoose.model('Movie', movieSchema);

module.exports = {
    addmovie: (movieData, callback) => {
        const movie = new Movie(movieData);
        movie.save()
            .then(() => callback(true))
            .catch((err) => {
                console.error('Error inserting movie:', err);
                callback(false);
            });
    }
}

