var db = require('../db/connect');
const collections = require('../db/collections');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {ObjectId}=require ('mongodb')
const { response, search } = require('../app');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', userSchema);

module.exports = {
    adduser: async (userData, callback) => {
        try {
            userData.password = await bcrypt.hash(userData.password, 10);
            const user = new User(userData);
            await user.save();
            callback(true);
        } catch (err) {
            console.error('Error inserting user:', err);
            callback(false);
        }
    },

usercomp:(userData)=>{
    return new Promise(async(resolve,reject)=>{
       let loginStatus=false
       let response={}
        let user= await db.get().collection(collections.USERS_COLLECTION).findOne({email:userData.email})
        if(user){
            await bcrypt.compare(userData.password,user.password).then((status)=>{
                if(status){
                    console.log("login success")
                    response.user=user
                    response.status=true
                    resolve(response)
                }else{
                    console.log("login failed")
                    resolve({status:false})
                }

            })   
        }else{
            console.log("Data not in the database")
            resolve({status:false})
        }
    })

},
getAllusers:()=>{
        return new Promise(async(resolve,reject)=>{
        let users= await db.get().collection(collections.USERS_COLLECTION).find().toArray();
        resolve(users)
        })
    },
    addToFav: (movieId, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let fav = await db.get().collection(collections.FAVORITE_COLLECTION).findOne({ user: new ObjectId(userId) });
                if (fav) {
                    db.get().collection(collections.FAVORITE_COLLECTION)
                        .updateOne(
                            { user: new ObjectId(userId) },
                            { $push: { movie: new ObjectId(movieId) } }
                        )
                        .then((response) => {
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                } else {
                    let favorite = {
                        user: new ObjectId(userId),
                        movie: [new ObjectId(movieId)]
                    };
                    db.get().collection(collections.FAVORITE_COLLECTION)
                        .insertOne(favorite)
                        .then((response) => {
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        });
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    viewFav: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let favMovie = await db.get().collection(collections.FAVORITE_COLLECTION).aggregate([
                    {
                        $match: { user: new ObjectId(userId) }
                    },
                    {
                        $lookup: {
                            from: 'movies', 
                            let: { movList: '$movie' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $in: ['$_id', '$$movList']
                                        }
                                    }
                                }
                            ],
                            as: 'favMovie'
                        }
                    }
                ]).toArray();
                
                if (favMovie.length > 0 && favMovie[0].favMovie.length > 0) {
                    resolve(favMovie[0].favMovie);
                } else {
                    resolve([]); // Return an empty array if no favorite movies are found
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    removeFav: (movieId, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let fav = await db.get().collection(collections.FAVORITE_COLLECTION).findOne({ user: new ObjectId(userId) });
                if (fav) {
                    db.get().collection(collections.FAVORITE_COLLECTION)
                        .updateOne(
                            { user: new ObjectId(userId) },
                            { $pull: { movie: new ObjectId(movieId) } }
                        )
                        .then((response) => {
                            if (response.modifiedCount > 0) {
                                resolve();
                            } else {
                                reject(new Error('Movie not found in favorites'));
                            }
                        })
                        .catch((error) => {
                            reject(error);
                        });
                } else {
                    reject(new Error('User has no favorites'));
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    editProf: (userId, userData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USERS_COLLECTION)
                .updateOne({ _id: new ObjectId(userId) }, {
                    $set: userData
                }).then((response) => {
                    resolve(response);
                }).catch((err) => {
                    reject(err);
                });
        });
    },
    deleteUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.USERS_COLLECTION)
            .deleteOne({_id:new ObjectId(userId)}).then((user)=>{
                resolve(user)
            }).catch((err)=>{
                reject(err)
                console.log('error deleting the movie');
            })
        })
    }
}