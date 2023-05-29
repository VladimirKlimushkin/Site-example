// 1 коллекция со вложенными данными

let express = require(`express`);
let app = express();
let port = 3003;

app.listen(port, function () {
    console.log(`http://localhost:${port}`);
})

// Раздача статики
app.use(express.static(`public`));

// Настройка handlebars
const hbs = require('hbs');
app.set('views', 'views');
app.set('view engine', 'hbs');

// Настройка POST-запроса
app.use(express.urlencoded({
    extended: true
}))

// Настройка БД
let mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/films-app3');

// Модель актёра
let actorsSchema = new mongoose.Schema({
    fullName: String,
    country: String,
    age: Number,
    description: String
});

let Actor = mongoose.model('actor', actorsSchema);

// Схема комментария
let commentSchema = new mongoose.Schema({
    author: String,
    text: String,
    rating: {
        type: Number,
        min: 1,
        max: 10
    }
});

// Модель фильма
let filmsSchema = new mongoose.Schema({
    title: String,
    year: Number,
    genres: [String],
    comments: [commentSchema],
    actors: [{
        type: mongoose.ObjectId,
        ref: 'actor'
    }]
});

let Film = mongoose.model('film', filmsSchema);

app.get(`/`, async function (req, res) {
    let genre = req.query.genre;

    let films;
    if (genre) {        
        films = await Film.find();
    } else {
        films = await Film.find({});
    }
    res.render(`index`, {
        films: films
    });
});

app.get(`/film`, async function (req, res) {
    let film_id = req.query.film_id;
    let film = await Film.findOne({_id: film_id})
                        .populate('actors');
                        // .populate({path: 'actors', select: 'fullName age'});
                     
    res.render(`film`, film);
});

app.get(`/actor`, async function (req, res) {
    let id = req.query.id;
    let actor = await Actor.findOne({_id: id});
    let films = await Film.find({'actors': id});

    res.render(`actor`, {
        actor: actor, 
        films: films
    });
});

app.post(`/add-comment`, async function (req, res) {
    let film_id = req.query.film_id;

    let text = req.body.text;
    let author = req.body.author;
    let rating = req.body.rating;


    let film = await Film.findOne({
        _id: film_id
    });

    film.comments.push({
        text: text,
        author: author,
        rating: rating
    });

    await film.save();
    res.redirect(`back`);

})

app.get(`/remove-comment`, async function (req, res) {
    let comment_id = req.query.comment_id;
    let index = req.query.index;

    let film = await Film.findOne({
        'comments._id': comment_id
    });
    film.comments.splice(index, 1);
    await film.save();

    res.redirect(`back`);
})