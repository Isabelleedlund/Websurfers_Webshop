const express               = require("express");
const Admin                 = require("../model/admin");
const productItem           = require("../model/product");
const jwt                   = require("jsonwebtoken");
const verifyTokenAdmin      = require("./verifyTokenAdmin");

// middleware \\
const router                = express.Router();

// Variables \\
const adminROUTE = {
    login: "/admin/login",
    welcome: "/admin/welcome",
    products: "/admin/products",
    addproduct: "/admin/addproduct",
    editproduct: "/admin/editproduct/:id",
    deleteproduct: "/admin/delete/:id",
    orders: "/admin/orders",
    logout: "/admin/logout",
    editorders: "/admin/editorders/:id",
    settings: "/admin/settings",
    addadmin: "/admin/addadmin"
};

const adminVIEW = {
    login: "admin/login",
    welcome: "admin/welcome",
    products: "admin/products",
    addproduct: "admin/addproduct",
    editproduct: "admin/editproduct",
    orders: "admin/orders",
    editorders: "admin/editorders/:id",
    settings: "admin/settings",
    addadmin: "admin/addadmin"
};

// admin welcome \\
router.get(adminROUTE.welcome, (req, res) => {
    res.render(adminVIEW.welcome);
});

// admin login \\
router.get(adminROUTE.login, async (req, res) => {
    const admin = await new Admin({ // Detta är vår hårdkodade Admin som behövs för första test om vi tar bort huvudadmin. 
        email: "admin@websurfers.com",
        password: "admin"
    }).save();
    const errorMessage = ""
    res.render(adminVIEW.login, {
        errorMessage
    });
});

router.post(adminROUTE.login, async (req, res) => {

    const admin = await Admin.findOne({
        email: req.body.loginemail,
        password: req.body.loginpassword
    })
    if (!admin) return res.render(adminVIEW.login, {
        errorMessage: "You are not an admin or wrong password"
    })

    jwt.sign({
        admin
    }, "secretKeyAdmin", (err, token) => {
        if (err) return res.redirect(adminROUTE.login);
        if (token) {
            const cookie = req.cookies.jsonwebtoken;
            if (!cookie) {
                res.cookie("jsonwebtoken", token, {
                    maxAge: 250000000,
                    httpOnly: true
                });
            }
            res.render(adminVIEW.welcome, {
                admin
            });
        }
        res.redirect(adminROUTE.login);
    });
});

// log Out \\
router.get(adminROUTE.logout, (req, res) => {
    res.clearCookie("jsonwebtoken").redirect(adminROUTE.login);
});

// admin products \\
router.get(adminROUTE.products, verifyTokenAdmin, async (req, res) => {
    const currentPage = req.query.page || 1;
    const productPerPage = 2;
    const sortByDate = req.query.sort;

    const allProducts = await productItem.find();

    const fiveProducts = await productItem.find().sort({
        date: sortByDate
    }).skip((currentPage - 1) * productPerPage).limit(productPerPage)
    const pagesCount = Math.ceil(allProducts.length / productPerPage)

    res.render(adminVIEW.products, {
        fiveProducts,
        pagesCount,
        currentPage
    });
});

router.get(adminROUTE.deleteproduct, verifyTokenAdmin, async (req, res) => {
    await productItem.deleteOne({
        _id: req.params.id
    });
    res.redirect(adminROUTE.products)
});

// admin addproduct \\

router.get(adminROUTE.addproduct, (req, res) => {
    res.render(adminVIEW.addproduct)
});

router.post(adminROUTE.addproduct, verifyTokenAdmin, async (req, res) => {
    const addProduct = new productItem({
        title: req.body.title,
        image: req.body.image,
        price: req.body.price,
        description: req.body.description,
        quantity: req.body.quantity,
        country: req.body.country,
        user: req.admin.admin._id // HÄR SAKNAS NÅT :)
    });

    await addProduct.save((error, success) => {
        if (error) return res.send(error.message)
        if (success) {
            console.log(req.body.country)
            res.redirect(adminROUTE.products)

        }
    })

});

// admin editproduct \\
router.get(adminROUTE.editproduct, verifyTokenAdmin, async (req, res) => {
    const response = await productItem.findById({
        _id: req.params.id
    })
    res.render(adminVIEW.editproduct, {
        response
    })
});

router.post(adminROUTE.editproduct, async (req, res) => {
    await productItem.updateOne({
        _id: req.body._id
    }, {
        $set: {
            title: req.body.title,
            image: req.body.image,
            price: req.body.price,
            description: req.body.description,
            quantity: req.body.quantity,
            country: req.body.country,
        }
    })
    //, {
    //     runValidators: true
    // }, (error) => error ? res.send(error.message) :
    res.redirect(adminROUTE.products)

    //)
});

// admin orders \\
router.get(adminROUTE.orders, (req, res) => {
    res.render(adminVIEW.orders);
});

router.post(adminROUTE.orders, async (req, res) => {
    res.send("Now on edit product")
});

// admin settings  \\
router.get(adminROUTE.settings, (req, res) => {
    res.render(adminVIEW.settings);
});

module.exports = router;

// add admin \\ // Början på att lägga till en admin, därav ligger detta kvar. 
/* router.get(adminROUTE.addadmin, (req,res) =>{
res.render(adminVIEW.addadmin);
})
router.post(adminROUTE.addadmin, verifyTokenAdmin, async (req, res) => {
    const addAdmin = new Admin({
        email: req.body.email,
        password: req.body.password,
        firstname: req.body.fname,
        lastname: req.body.lname
    });


    const salt = await bcrypt.genSaltSync(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt)
    const signUpuser = await User.findOne({ email: req.body.email })
    
    if (signUpuser) return res.render(userVIEW.signup, { errorMessage: "Email already exist" })
    const user = await new User({
        email: req.body.email,
        password: hashPassword
    }).save();
    res.render(userVIEW.welcome, { user })

    transport.sendMail({
        to: user.email,
        from: "<noreply>stefan.hallberg@medieinstitutet.se",
        subject: "Login Suceed",
        html: "<h1>  Välkommen </h1>" + user.email
    })
});
    
    await addAdmin.save((error, success) => {
        if (error) return res.send(error.message)
        if (success) {
            //res.redirect(adminROUTE.addadmin)
            res.send("You are now an admin")
            
        }
    })
    
}); */


