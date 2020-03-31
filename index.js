const mongoose        = require("mongoose");
const express         = require("express");
const config          = require("./config/config"); 
const User            = require("./router/customerRouter"); 
const Admin           = require("./router/adminRouter"); 
const path            = require("path");
const app             = express();
const cookieparser    = require("cookie-parser");
const stripe          = require("stripe")("sk_test_faWq8pM0PWlpcbv8XMMXYC8C00lfXcRpPM");




// Stripe Payment \\
const paymentIntent = await stripe.paymentIntents.create({
  amount: Number,
  currency: "sek",
  metadata: {integration_check: "accept_a_payment"}
})

const stripe = Stripe('pk_test_YdqKsq7KM50ZZyi98Os90Y3A000xvgdY8x');
const elements = stripe.elements();


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