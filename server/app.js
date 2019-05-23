const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const index = require("./routes/index");
const products = require("./routes/products");
const categories = require("./routes/categories");
const seeder = require("./routes/seeder/products");
const stripe = require("stripe")("PRIVT_KEY");

const app = express();

//Set up default mongoose connection
const mongoDB = "mongodb://127.0.0.1/vueexpress";
mongoose.connect(mongoDB, { useNewUrlParser: true });
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

app.use("/", index);
app.use("/products", products);
app.use("/categories", categories);
app.use("/seeder", seeder);
app.post("/charge", (req, res, next) => {
    let amount = req.body.total * 100;

    stripe.customers
        .create({
            email: req.body.stripeToken.email,
            source: req.body.stripeToken.id //source == stripeToken.id not just stripeToken
        })
        .then(customer =>
            stripe.charges.create({
                amount,
                description: "Ecommerce Shopping Cart",
                currency: "usd",
                customer: customer.id
            })
        )
        .then(charge => res.json(req.body.stripeToken));
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;