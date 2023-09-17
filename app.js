const express = require('express');
const app = express();
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const Spot = require('./models/spots');
const User = require('./models/user');
const CryptoJS = require("crypto-js");
const methodOverride = require('method-override');

dotenv.config();

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("DB Connection Successful"))
    .catch((err) => {
        console.log(err);
    });

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.json());


app.get('/', (req, res) => {
    res.render('homepage');
})


app.get('/Hotspots/new', (req, res) => {
    res.render('Hotspots/newSpot');
})

app.post('/Hotspots', async (req, res) => {
    const spot = new Spot(req.body.spot);
    await spot.save();
    console.log(spot);
    res.redirect('/Hotspots/viewSpot');
})

app.get('/Hotspots/viewspot', async (req, res) => {
    const spots = await Spot.find({});
    res.render('Hotspots/landingpage', { spots });
})

app.get('/Hotspots/viewspot/:id', async (req, res) => {
    const spot = await Spot.findById(req.params.id);
    res.render('Hotspots/viewSpot', { spot });
})

app.get('/Hotspots/viewspot/:id/edit', async (req, res) => {
    const spot = await Spot.findById(req.params.id);
    res.render('Hotspots/editpage', { spot });
})

app.put('/Hotspots/viewspot/:id', async (req, res) => {
    const { id } = req.params;
    const spot = await Spot.findByIdAndUpdate(id, { ...req.body.spot });
    res.redirect(`Hotspots/viewspot/${spot._id}`);
})

app.delete('/Hotspots/viewspot/:id', async (req, res) => {
    const { id } = req.params;
    await Spot.findByIdAndDelete(id);
    res.redirect('/Hotspots/viewspot');
})

app.get('/register', (req, res) => {
    res.render('User/register');
})

app.post("/register", async (req, res) => {
    const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: CryptoJS.AES.encrypt(
            req.body.password,
            process.env.PASS_SEC
        ).toString(),
    });
    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.get("/login", async (req, res) => {
    res.render("User/login");
})

app.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });

        if (!user) {
            return res.status(401).json("Wrong credentials!");
        }

        const hashedPassword = CryptoJS.AES.decrypt(user.password, process.env.PASS_SEC);
        const correctPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

        if (correctPassword !== req.body.password) {
            return res.status(401).json("Wrong credentials!");
        }

        // If credentials are correct, send the response
        const { password, ...others } = user._doc;
        res.status(200).json(others);
    } catch (err) {
        res.status(500).json(err);
    }
});


app.listen(3000, () => {
    console.log("Serving on port 3k");
})