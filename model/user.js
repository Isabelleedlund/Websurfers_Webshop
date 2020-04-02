const mongoose          = require("mongoose");
const Schema            = require("mongoose").Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    firstname: String,
    lastname: String,
    address: String,
    zipcode: Number,
    city: String,
    resetToken: String,
    expirationToken: Date,
    checkout: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    }],
    wishlist: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    }],
    // quantity: {
    //     type: Number,
    //     required: true
    // }
});

// Add to Checkout \\
userSchema.methods.addToCheckout = function (product) {
    this.checkout.push({
        productId: product._id
    })
    const newcheckout = this.checkout.filter(function ({
        productId
    }) {
        return !this.has(`${productId}`) && this.add(`${productId}`)

    }, new Set)
    this.checkout = [...newcheckout]
    return this.save()
};

// Remove from Checkout \\
userSchema.methods.removeFromCheckOutList = function (productId) {
    const remainingcheckoutProducts = this.checkout.filter((product) => {
        return product.productId.toString() !==
            productId.toString()
    })
    this.checkout = remainingcheckoutProducts;
    return this.save()
};

// Add to Wishlist \\
userSchema.methods.addToWishlist = function (product) {
    this.wishlist.push({
        productId: product._id
    })
    const newWishlist = this.wishlist.filter(function ({
        productId
    }) {
        return !this.has(`${productId}`) && this.add(`${productId}`)

    }, new Set)
    this.wishlist = [...newWishlist]
    return this.save()
};

// Remove from Wishlist \\
userSchema.methods.removeFromList = function (productId) {
    const remainingWishlistProducts = this.wishlist.filter((product) => {
        return product.productId.toString() !==
            productId.toString()
    })
    this.wishlist = remainingWishlistProducts;
    return this.save()
};

const User = mongoose.model("User", userSchema)

module.exports = User;