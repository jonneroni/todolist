const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const favicon = require('serve-favicon');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.use(favicon(__dirname + '/public/images/favicon.ico'));

const mongoPW = process.env.MONGO_PASS;

mongoose.set('useFindAndModify', false);


// Connect to mongodb database named todolistDB
mongoose.connect("mongodb+srv://admin-jonne:" + mongoPW + "@cluster0-x3oli.mongodb.net/todolistDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Mongoose schema for items
const itemsSchema = new mongoose.Schema({
    name: String
});

// Create mongoose model Item
const Item = new mongoose.model("Item", itemsSchema);


// Create items based on the Item model
const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const item4 = new Item({
    name: "You can create a new list by adding the name to the URL"
});

const defaultItems = [item1, item2, item3, item4];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {

    Item.find({}, (err, items) => {

        if (items.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Succesfully added the items.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: items
            });
        }
    });

});


app.get("/:customList", (req, res) => {

    const customListName = _.capitalize(req.params.customList);

    List.findOne({
        name: customListName
    }, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                // Create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // Show existing list
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    });

})

app.post("/", (req, res) => {

    // Get the inputted text from list.ejs with bodyparser
    const itemName = req.body.nextItem;
    const listName = req.body.list;

    // Create a new item from the input
    const item = new Item({
        name: itemName
    });


    if (listName === "Today") {
        // Save the item to the Item(s) collection
        item.save();
        // Redirect to root in order to display the new saved item
        res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }); 
    }
});

// Handle the post req when user ticks the checkbox
app.post("/delete", (req, res) => {

    // Get the value of the checkbox (item._id)
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, (err) => {
            if (!err) {
                console.log("Succesfully deleted the item with id:" + checkedItemId);
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({
                name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
                if (!err) {
                    res.redirect("/" + listName); 
                }
            }
        )
    };
});



app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(3000, function () {
    console.log("Server started on port 3000.");
});
