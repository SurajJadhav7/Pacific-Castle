const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const ejs = require("ejs");

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"))
app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://admin:mnb123@cluster0.uukei.mongodb.net/myFirstDatabase?retryWrites=true/todolistDB", {useNewUrlParser: true})

const itemsSchema = new mongoose.Schema({
    name: String
});
const Item = new mongoose.model("todo", itemsSchema);

const item1 = new Item({
    name: "Welcome to your ToDo list"
});

const item2 = new Item({
    name: "Click + button to add new item"
});

const item3 = new Item({
    name: "Hit the checkbox to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("defaultItems inserted.")
                }
            })
            res.redirect("/")
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            })
        }
    })
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    console.log(req.params);
    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const newList = new List({
                    name: customListName,
                    items: defaultItems
                })
                newList.save()
                console.log("saved"+customListName);
                res.redirect("/" + customListName)
            } else {
                console.log("else block");
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                })
            }
        }
    })
});

app.get("/about", function (req, res) {
    res.render("about")
})

app.post("/", function (req, res) {
    const itemName = req.body.taskName;
    const listName = req.body.list;
    const newItem = new Item({
        name: itemName
    })
    if (listName === "Today") {
        newItem.save()
        res.redirect("/")
    } else {
        List.findOne({
            name: listName
        }, function (err, foundList) {
            if (!err) {
                foundList.items.push(newItem);
                foundList.save();
                res.redirect("/" + listName)
            }
        })
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err)
            } else {
                console.log("deleted");
            }
        })
        res.redirect("/")
    } else {
        List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err, foundList){
            res.redirect("/" + listName)
        });
    }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
    console.log("Server is running....")
});