var express = require('express');
var movie=require("../movie/moviedb")   
var router = express.Router();
var multer = require('multer');
var path = require('path');
var userdb=require('../movie/usersdb');
const usersdb = require('../movie/usersdb');
const moviedb = require('../movie/moviedb');
const bcrypt = require('bcrypt');
const Admin  = require('../movie/adminlog');
const { response } = require('../app');
const adminlog = require('../movie/adminlog');
const { cast } = require('@tensorflow/tfjs');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'poster') {
      cb(null, 'uploads/'); 
    } else if (file.fieldname === 'trailer') {
      cb(null, 'trailer/'); 
    } else if (file.fieldname === 'songs') {
      cb(null, 'song/');
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp in filename to avoid conflicts
  }
});

const upload = multer({ storage: storage });


    router.get('/view-products', function(req, res) {
    let admin=req.session.admin
    movie.getAllmovies().then((movies) => {
    res.render("admin/view-products", { movies,admin });

  }).catch((err) => {
    console.error('Error fetching movies:', err);
    res.status(500).send('Server Error');
  });
});

 router.get('/', function(req, res) {

   res.render("admin/admin-login",{admin:true});
  
  })
router.get("/add-movie",function(req,res){             
    res.render("admin/add-movie")
});
router.post('/add-movie', upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'trailer' }, { name: 'songs' }]), (req, res) => {
  const movieData = {
    name: req.body.name,
    genre: req.body.genre,
    duration: req.body.duration,
    cast: req.body.cast,
    rating: req.body.rating,
    description: req.body.description,
    year: req.body.year,
    director: req.body.director,
    poster: req.files['poster'] ? `/uploads/${req.files['poster'][0].filename}` : '',

    trailer: req.files['trailer'] ? req.files['trailer'].map(trailer => ({
      filename: trailer.originalname,
      path: `/trailer/${trailer.filename}`
    })) : [],
    songs: req.files['songs'] ? req.files['songs'].map(song => ({
      filename: song.originalname,
      path: `/song/${song.filename}`
    })) : []
  };

  movie.addmovie(movieData, (success) => {
    if (success) {
      res.redirect('/admin/view-products');
      console.log("Movie has been inserted");
    } else {
      res.render("admin/add-movie",{ error: "Failed to add movie"});
      console.log("Failed to insert the movie");
    }
  });
});
router.get('/all-users', (req, res) => {
  usersdb.getAllusers().then((users) => {
      res.render("admin/all-users", { users }); 
  }).catch((err) => {
      console.error(err);
      res.status(500).send('Server Error');
  });
});

router.get("/delete-movie/:id",(req,res)=>{
  let movieid=req.params.id;
  console.log(movieid)
  moviedb.deleteMovie(movieid).then((response)=>{
    res.redirect("/admin/view-products")
  })
})
router.get('/edit-movie/:id',async (req,res)=>{
  let movie= await moviedb.getOnemovie(req.params.id)
  console.log(movie)
  res.render("admin/edit-movie",{movie})
})
router.post('/edit-movie/:id', upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'trailer' }, { name: 'songs' }]), (req, res) => {
  const movieDetails = {
      name: req.body.name,
      genre: req.body.genre,
      year: req.body.year,
      description: req.body.description,
      cast: req.body.cast,
      director: req.body.director,
      rating: req.body.rating,
      poster: req.files['poster'] && req.files['poster'][0] ? `/uploads/${req.files['poster'][0].filename}` : req.body.existingPoster,
      trailer: req.files['trailer'] && req.files['trailer'].length > 0
      ? req.files['trailer'].map(trailer => ({
          filename: trailer.originalname,
          path: `/trailer/${trailer.filename}`
        }))
      : JSON.parse(req.body.existingTrailer),  // Ensure existing trailer data persists
    songs: req.files['songs'] && req.files['songs'].length > 0
      ? req.files['songs'].map(song => ({
          filename: song.originalname,
          path: `/song/${song.filename}`
        }))
      : JSON.parse(req.body.existingSongs)  // Ensure existing songs data persists
  };
  moviedb.updateMovie(req.params.id, movieDetails).then(() => {
      res.redirect('/admin/view-products');
  }).catch((err) => {
      console.error('Error updating movie:', err);
      res.status(500).send('Failed to update movie');
  });
});
router.get("/delete-user/:id",(req,res)=>{
    let userId=req.params.id;
    userdb.deleteUser(userId).then(()=>{
        res.redirect('/admin/all-users')
    })

})
router.get("/search-admin", async (req, res) => {
  const query = req.query.q; 
  try {
      const movies = await moviedb.search(query);
      if (movies.length == 0) {
          return res.send('No results match your search.'); // Proper handling of empty results
      }
      res.render("admin/search-admin", { movies }); 
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

// Route to handle admin login
//post login
router.post("/admin-login", async (req, res) => {
  adminlog.adminComp(req.body).then((response)=>{
   if(response.status){
       req.session.loggedIn = true;
       req.session.admin = response.admin;
       res.redirect('/admin/view-products')
   }else{
       req.session.loginerr=true
       res.send('not logged')
   }
  })
});
//admin logout
router.get('/admin-logout',(req,res)=>{
    req.session.admin=null;
    res.redirect('/admin')
})


module.exports = router;
