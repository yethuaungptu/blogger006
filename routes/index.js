var express = require("express");
var router = express.Router();
var User = require("../models/User");
var Post = require("../models/Post");
var Comment = require("../models/Comment");

/* GET home page. */
router.get("/", async function (req, res, next) {
  const posts = await Post.find({})
    .sort({ created: -1 })
    .populate("author", "name")
    .limit(4);
  res.render("index", { posts: posts });
});

router.get("/register", function (req, res) {
  res.render("register");
});

router.post("/register", async function (req, res) {
  var user = new User();
  user.name = req.body.name;
  user.email = req.body.email;
  user.password = req.body.password;
  const data = await user.save();
  console.log(data);
  res.redirect("/login");
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/login", async function (req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (user != null && User.compare(req.body.password, user.password)) {
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };
    res.redirect("/users");
  } else {
    res.redirect("/login");
  }
});

router.post("/checkDup", async function (req, res) {
  const user = await User.findOne({ email: req.body.email });
  res.json({ status: user != null ? true : false });
});

router.get("/bloglist", async function (req, res) {
  const posts = await Post.find({}).populate("author", "name");
  console.log(posts);
  res.render("bloglist", { posts: posts });
});

router.get("/blogdetail/:id", async function (req, res) {
  const post = await Post.findById(req.params.id).populate("author", "name");
  let reactStatus;
  let favStatus;
  if (req.session.user) {
    const user = await User.findById(req.session.user.id);
    favStatus = user.favoriteB.filter(function (data) {
      return data.blogger == post.author._id.toString();
    });
    reactStatus = post.like.filter(function (data) {
      return data.user == req.session.user.id;
    });
  } else {
    reactStatus = [];
    favStatus = [];
  }
  const comments = await Comment.find({ post: req.params.id }).populate(
    "commenter",
    "name"
  );
  res.render("blogdetail", {
    post: post,
    reactStatus: reactStatus,
    favStatus: favStatus,
    comments: comments,
  });
});

router.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    if (err) throw err;
    res.redirect("/");
  });
});
module.exports = router;
