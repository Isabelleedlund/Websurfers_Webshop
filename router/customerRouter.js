const express               = require("express");
const bodyParser            = require("body-parser");
const bcrypt                = require("bcryptjs");
const User                  = require("../model/user");
const productItem           = require("../model/product");
const nodemailer            = require("nodemailer");
const jwt                   = require("jsonwebtoken");
const crypto                = require("crypto");
const verifyToken           = require("./verifyToken");
const sendGridTransport     = require("nodemailer-sendgrid-transport");
const config                = require("../config/config");
if (process.env.NODE_ENV !== 'production') require('dotenv').config({ path: "./.env" });
const stripe                = require("stripe")(process.env.client_secret);

// middleware  \\
const router = express();
//Api-nyckeln för SendGrid är rätt men SendGrid vill inte accepterat vår nyckel. Har även skapat flera olika nycklar men dessa blev inte godkända. Alla i gruppen har testat men koderna fungerar ej. Testat med flera olika sätt. Algoritmerna är rätt. 
const transport = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_user: config.mail,
    }
}));

router.use(bodyParser.urlencoded({ extended: false }))
router.use(express.urlencoded({ extended: true }));
router.set("view engine", "ejs");
router.use(express.static("public"));

// Variables \\
const userROUTE = {
    main: "/",
    course: "/course",
    checkout: "/checkout",
    checkoutid: "/checkout/:id",
    deletecheckout: "/deletecheckout/:id",
    login: "/login",
    signup: "/signup",
    welcome: "/welcome",
    settings: "/settings",
    settingparams: "/settings/:id",
    orders: "/orders",
    logout: "/logout",
    thankyou: "/thankyou",
    delete: "/delete/:id",
    reset: "/reset",
    resetform: "/reset/:token",
    prodgenerator: "/prodgenerator",
    wishlist: "/wishlist",
    wishlistid: "/wishlist/:id",
    deletewishlist: "/deletewishlist/:id"
};

const userVIEW = {
    main: "firstpagevideo",
    course: "course",
    checkout: "checkout",
    login: "login",
    signup: "signup",
    welcome: "welcome",
    orders: "orders",
    settings: "settings",
    orders: "orders",
    thankyou: "thankyou",
    reset: "reset",
    resetform: "resetform",
    wishlist: "wishlist",

    prodgenerator: "/partial/prodgenerator"
};

// customer main \\
router.get(userROUTE.main, (req, res) => {
    res.render(userVIEW.main);
});

router.get(userROUTE.course, verifyToken, async (req, res) => {
    const currentPage = req.query.page || 1;
    const productPerPage = 1;
    const sortByDate = req.query.sort;
    const allCourses = await productItem.find();
    const oneCourse = await productItem.find().sort({
        date: sortByDate
    }).skip((currentPage - 1) * productPerPage).limit(productPerPage)
    const pagesCount = Math.ceil(allCourses.length / productPerPage)

    res.render(userVIEW.course, {
        oneCourse,
        pagesCount,
        currentPage
    });

    console.log(req.body)
    const user = await User.findOne({_id: req.body.user._id}).populate("checkout.productId");
    console.log(user, "hej");
    return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: user.checkout.map((product) => {
            return {
                name: product.productId.title,
                amount: product.productId.price*100, // *100 är för att det inte ska vara öre
                quantity: 1, 
                currency: "sek",
            }
        }),
        success_url: req.protocol + "://" + req.get("Host") + "/",
        cancel_url: "http://localhost:8003/course"
    }).then( (session) => {
        res.render(userVIEW.course, {user, sessionId:session.id})
    });
});


// customer course \\
// router.get(userROUTE.course, async (req, res) => {
//     const currentPage = req.query.page || 1;
//     const productPerPage = 1;
//     const sortByDate = req.query.sort;

//     const allCourses = await productItem.find();

//     const oneCourse = await productItem.find().sort({
//         date: sortByDate
//     }).skip((currentPage - 1) * productPerPage).limit(productPerPage)
//     const pagesCount = Math.ceil(allCourses.length / productPerPage)

//     res.render(userVIEW.course, {
//         oneCourse,
//         pagesCount,
//         currentPage
//     });
// });

// Customer Checkout \\ 
router.get(userROUTE.checkout, verifyToken, async (req, res) => {
    console.log(req.body)
    const user = await User.findOne({_id: req.body.user._id}).populate("checkout.productId");
    console.log(user, "hej");
    return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: user.checkout.map((product) => {
            return {
                name: product.productId.title,
                amount: product.productId.price*100, // *100 är för att det inte ska vara öre
                quantity: 1, 
                currency: "sek",
            }
        }),
        success_url: req.protocol + "://" + req.get("Host") + "/",
        cancel_url: "http://localhost:8003/course"
    }).then( (session) => {
        res.render(userVIEW.checkout, {user, sessionId:session.id})
    });
});

router.get(userROUTE.checkoutid, verifyToken, async (req, res) => {
    const product = await productItem.findOne({_id:req.params.id})
    const user = await User.findOne({_id:req.body.user._id})
    console.log(req.body.user)
    await user.addToCheckout(product)
    res.redirect(userROUTE.checkout);
});

router.get(userROUTE.deletecheckout, verifyToken, async (req, res) => {
    const user = await User.findOne({_id:req.body.user._id})
    
    user.removeFromCheckOutList(req.params.id)
    res.redirect(userROUTE.course);
});

// customer signup \\
router.get(userROUTE.signup, async (req, res) => {
    const errorMessage = "error"
    const findUser = await User.find();
    res.render(userVIEW.signup, { findUser, errorMessage });
});

router.post(userROUTE.signup, async (req, res) => {
    const salt = await bcrypt.genSaltSync(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt)
    const signUpuser = await User.findOne({ email: req.body.email })

    if (signUpuser) return res.render(userVIEW.signup, { errorMessage: "Email already exist" })
    const user = await new User({
        email: req.body.email,
        password: hashPassword
    }).save();
    res.render(userVIEW.main, { user })
    // res.send("Du har blivit uppsignad")

    transport.sendMail({
        to: user.email,
        from: "edlund.isabelle@gmail.com",
        subject: "Login Succeed",
        html: "<h1>  Välkommen </h1>" + user.email
    })
});

// customer login \\
router.get(userROUTE.login, (req, res) => {
    const errorMessage = ""
    res.render(userVIEW.login, { errorMessage });
});

router.post(userROUTE.login, async (req, res) => {
    const user = await User.findOne({
        email: req.body.loginemail
    })
    if (!user) return res.render(userVIEW.login, { errorMessage: "Email does not exist" })
    const validUser = await bcrypt.compare(req.body.loginpassword, user.password)
    if (!validUser) return res.render(userVIEW.login, { errorMessage: "Wrong password" })

    jwt.sign({ user }, "secretKey", (err, token) => {
        if (err) return res.redirect(userROUTE.login);
        if (token) {
            const cookie = req.cookies.jsonwebtoken;
            if (!cookie) {
                res.cookie("jsonwebtoken", token, { maxAge: 250000000, httpOnly: true });
            }
            res.render(userVIEW.welcome, { user });
        }
        res.redirect(userROUTE.login);
    });
});

// log Out \\
router.get(userROUTE.logout, (req, res) => {
    res.clearCookie("jsonwebtoken").redirect(userROUTE.main);
});

// customer welcome \\
router.get(userROUTE.welcome, (req, res) => {
    res.render(userVIEW.welcome);
});

// customer wishlist \\
router.get(userROUTE.wishlist, verifyToken, async (req, res) => {
    const user = await User.findOne({ _id: req.body.user._id }).populate("wishlist.productId")
    console.log(user)
    res.render(userVIEW.wishlist, { user });
});

router.get(userROUTE.wishlistid, verifyToken, async (req, res) => {
    const product = await productItem.findOne({ _id: req.params.id })
    const user = await User.findOne({ _id: req.body.user._id })
    console.log(req.body.user)
    await user.addToWishlist(product)
    res.redirect(userROUTE.wishlist);
});

router.get(userROUTE.deletewishlist, verifyToken, async (req, res) => {
    const user = await User.findOne({ _id: req.body.user._id })

    user.removeFromList(req.params.id)
    res.redirect(userROUTE.wishlist);
});

// customer settings \\
router.get(userROUTE.settings, (req, res) => {
    res.render(userVIEW.settings);
});

router.post(userROUTE.settings, async (req, res) => {
    const user = await User.updateOne({ _id: req.body._id })
    user.firstname = req.body.fname,
        user.lastname = req.body.lname,
        user.email = req.body.email,
        user.address = req.body.address,
        user.zipcode = req.body.zipcode,
        user.city = req.body.city,
        user.password = req.body.password,
        user.confpassword = req.body.confpassword
    console.log(user);
    await user.save();
});

// customer orders \\
router.get(userROUTE.orders, (req, res) => {
    res.render(userVIEW.orders);
});


// customer thankyou \\
router.get(userROUTE.thankyou, (req, res) => {
    res.render(userVIEW.thankyou);
});


// customer reset password
// skickas mejl med länk för att återställa lösenordet
router.get(userROUTE.reset, (req, res) => {
    res.render(userVIEW.reset);
});

router.post(userROUTE.reset, async (req, res) => {
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.redirect(userROUTE.signup)

    crypto.randomBytes(32, async (err, token) => {
        if (err) return res.redirect(userROUTE.signup);
        const resetToken = token.toString("hex");

        user.resetToken = resetToken;
        user.expirationToken = Date.now() + 1000000;
        await user.save();

        await transport.sendMail({
            to: user.email,
            from: "edlund.isabelle@gmail.com",
            subject: "Reset password",
            html: `<h1> Reset Password Link: http://localhost:8003/reset/${resetToken} </h1>`
        })
        res.redirect(userROUTE.login)
    })

});

//hämtar user länken där mann återställer sjäkva lösenordet
router.get(userROUTE.resetform, async (req, res) => {
    const user = await User.findOne({ resetToken: req.params.token, expirationToken: { $gt: Date.now() } })
    if (!user) return res.redirect(userROUTE.signup)
    res.render(userVIEW.resetrform, { user })
});

router.post(userROUTE.resetform, async (req, res) => {
    const user = await User.findOne({ _id: req.body.userId })

    user.password = bcrypt.hash(req.body.password, 10);
    user.resetToken = undefined;
    user.expirationToken = undefined;
    await user.save();

    res.redirect(userROUTE.login)
});

module.exports = router;