require('dotenv').config()

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');
// const date = require(__dirname + "/date.js");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_ATLAS,{useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

// Schema
const itemsSchema = {
  name:{
    type: String,
    required: true
  }
}

// Model
const Items = mongoose.model("item", itemsSchema);

// Document
const item1 = new Items({
  name: "Welcome to your todolist!"
});

const item2 = new Items({
  name: "Hit the + button to add a new item."
});

const item3 = new Items({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);

app.get("/", function(req, res) {

// const day = date.getDate();

  Items.find({}, function(err, foundData){

    if(foundData.length === 0){
      Items.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundData});
    }
  })
});

app.get("/:list", function(req,res){

  const customList = _.capitalize(req.params.list);

  List.findOne({name: customList},function(err, foundList){
    if(err){
      console.log(err);
    }else{
      if(!foundList){
        // Create a new list
        const list = new List({
          name: customList,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customList)
      }else{
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Items({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/")
  }else{
    List.findOne({name: listName}, function(err, listFound){
      listFound.items.push(item);
      listFound.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Items.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
