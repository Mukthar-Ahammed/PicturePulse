var express = require('express');
var router = express.Router();
const userdb = require("../movie/usersdb");
const moviedb = require("../movie/moviedb");
const toxicity=require('@tensorflow-models/toxicity')

/* GET home page. */
router.get('/', async (req, res, next) => {
   let user=req.session.user
   moviedb.getAllmovies().then((movies)=>{
    console.log(user)
    res.render('user/view-movie',{movies,user})
   })
});

// Login page
router.get("/user-login", (req, res) => {
    if(req.session.loggedIn){
        res.redirect('/')
    }else{
        res.render('user/user-login',{"loginerr":req.session.loginerr});
        req.session.loginerr=false
    }
    
});

//aboutpage

router.get('/user-about', (req, res) => {
    let user=req.session.user
    res.render('user/user-about',{user});
});

//for signup
router.post("/user-signup", async (req, res) => {
    const userData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
    };
    try {
        await userdb.adduser(userData, (success) => {
            if (success) {
                res.redirect('/');
                console.log('New user has been registered');
            } else {
                res.redirect('user/user-login', { error: 'Failed to signup' });
                console.log('Failed to signup');
            }
        });
    } catch (err) {
        res.redirect('user/user-login', { error: 'An error occurred during login' });
        console.error('Error in signup route:', err);
    }
});
//post login
router.post("/user-login", async (req, res) => {
   userdb.usercomp(req.body).then((response)=>{
    if(response.status){
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect('/')
    }else{
        req.session.loginerr=true
        res.redirect('/user-login')
    }
   })
});

//user profile
router.get('/user-profile', async (req, res) => {
    let user = req.session.user;
    try {
        let movie = await userdb.viewFav(req.session.user._id);
        console.log('Favorite Movies:', movie); 
        res.render('user/user-profile', { user, movie });
    } catch (err) {
        console.error('Error Occured in the user-profile:', err);
        res.render('user/user-profile', { user, movie: [] }); // Render the profile with an empty array in case of error
    }
});

//logout
router.get('/user-logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/')
})


router.get('/movie-info/:id', async (req, res) => {
    try {
 
        let user = req.session.user;
        let movie = await moviedb.getOnemovie(req.params.id);
        let reviews = await moviedb.viewReviews(req.params.id);     
        console.log(reviews);

        res.render('user/movie-info', { movie, user, reviews });
    } catch (error) {
        console.error("Error fetching movie info or reviews:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/favorites/:id',(req,res)=>{
    let user=req.session.user
    userdb.addToFav(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/user-profile')
    })
})
router.get('/delete-movie/:id',(req,res)=>{
    userdb.removeFav(req.params.id,req.session.user._id).then(()=>{
        res.redirect('/user-profile')
    })
})

router.get('/edit-profile', (req, res) => {
    if (req.session.user) {
        res.render('user/edit-profile', { user: req.session.user });
    } else {
        res.redirect('/login');
    }
});
router.post('/edit-profile/:id', (req, res) => {
    const userId = req.params.id;
    const userData = {
        username: req.body.username,
        email: req.body.email
    };

    userdb.editProf(userId, userData).then(() => {
        req.session.user.username = userData.username;
        req.session.user.email = userData.email;

        res.redirect('/user-profile');
    }).catch((err) => {
        console.log("Error updating the profile", err);
        res.status(500).send("Error updating the profile");
    });
});
router.post("/review/:id", async (req, res) => {
    let model;
    const threshold = 0;
    await toxicity.load(threshold).then((loadedmod) => {
        model = loadedmod;
    });

    const reviewData = {
        review: req.body.review
    };

    let toxicityResult = [];
    if (model) {
        const predictions = await model.classify([reviewData.review]);
        toxicityResult = predictions
            .filter(prediction => prediction.results[0].match) // Only include matches
            .map(prediction => ({
                label: prediction.label,
                match: prediction.results[0].match,
                score: prediction.results[0].probabilities[1],
            }));
    }

    moviedb.addreview(req.params.id, req.session.user._id, reviewData, toxicityResult)
        .then(() => {
            res.redirect(`/movie-info/${req.params.id}`);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error adding review");
        });
        
});
router.get('/search', async (req, res) => {
    const query = req.query.q; 
    try {
        const movies = await moviedb.search(query);
        if(movies.length==0){
            res.render('user/failure-page')
        }
        res.render('user/search-results', { movies }); 

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
module.exports = router;
