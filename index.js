const mongoose              = require("mongoose");
const express               = require("express");
const config                = require("./config/config"); 
const User                  = require("./router/customerRouter"); 
const Admin                 = require("./router/adminRouter"); 
const path                  = require("path");
const app                   = express();
const cookieparser          = require("cookie-parser");

// Stripe Payment \\
// var stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
// var elements = stripe.elements();

app.use(cookieparser());

app.use(express.urlencoded({
  extended: true
}));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(User);
app.use(Admin);

const dbOptions = {
  useUnifiedTopology: true,
  useNewUrlParser: true
};
const port = process.env.PORT || 8003;
mongoose.connect(config.databaseURL, dbOptions).then(() => {
  app.listen(port, () => console.log(`App listening on port ${port}!`));
});