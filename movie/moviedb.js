const mongoose = require('mongoose');
var db=require('../db/connect')
const collections = require('../db/collections');
const {ObjectId}=require ('mongodb');
const { query } = require('express');
const { path } = require('../app');
const movieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    genre: {
        type: String,
        required: true

    },poster: {
        type: String,
        required:true

    },cast:{
        type:String,
        required:true

    },year:{
        type:String,
        required:true

    },duration:{
        type:String,
        required:true
        
    },director:{
        type:String,
        required:true

    },rating:{
        type:String,
        required:true

    },description:{
        type:String,
        required:true
    }, trailer: [{
        filename: String,
        path: String,
      }],
      songs: [{
        filename: String,
        path: String,
       
    }]
});
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
    },
    getAllmovies:()=>{
        return new Promise(async(resolve,reject)=>{
            let movies=await db.get().collection(collections.MOVIE_COLLECTION).find().toArray();
            resolve(movies)
        })
    },
    getOnemovie:(movieid) => {
        return new Promise((resolve, reject) => {
                db.get().collection(collections.MOVIE_COLLECTION).findOne({_id:new ObjectId(movieid)}).then((movie)=>{
                    resolve(movie);
                });
            
        });
    },deleteMovie:(movieid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.MOVIE_COLLECTION).deleteOne({ _id:new ObjectId (movieid)}).then((movie)=>{
                resolve(movie)
            }).catch((err)=>{
                console.log("Error deleteing the Fav",err)
            })
        })
    },updateMovie: (movieId, movieDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.MOVIE_COLLECTION)
            .updateOne({ _id: new ObjectId(movieId) }, {
                $set: movieDetails
            }).then((response) => {
                resolve(response);
            }).catch((err) => {
                reject(err);
            });
        });
    },
    addreview: (movieId, userId, reviewData,toxicityResult) => {
        return new Promise(async (resolve, reject) => {
            try {
                let review = {
                    user: new ObjectId(userId),
                    movieId: new ObjectId(movieId),
                    reviewText: reviewData.review,
                    toxicityResult:toxicityResult,
                    date: new Date()
                };
                await db.get().collection(collections.REVIEW_COLLECTION).insertOne(review);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
        
    },viewReviews: (movieId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let reviews = await db.get().collection(collections.REVIEW_COLLECTION).aggregate([
                    {
                        $match: { movieId: new ObjectId(movieId) }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            as: 'userDetails'
                        }
                    },
                    {
                        $unwind: '$userDetails'
                        },
                        {
                        $project: {
                            _id: 0,
                            reviewText: 1,
                            date: 1,
                            'userDetails.username': 1,
                            toxicityResult:1,
                        }
                    }
                ]).toArray();
                
                console.log(reviews); 
                resolve(reviews);
            } catch (error) {
                reject(error);
            }
        });
    },search:(query)=>{
        return new Promise((resolve,reject)=>{
            try{
                const movsearch=db.get().collection(collections.MOVIE_COLLECTION).find({
                    name:{$regex:query,$options:'i'}
                }).toArray();
                resolve(movsearch)
            }catch(err){
                reject("error has been occured")
            }
        })
    }
}

