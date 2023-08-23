var express = require("express");
var multer = require("multer");
var fs = require("fs");
var upload = multer({ dest: "public/images/uploads/" });
var Post = require("../models/Post");
var User = require("../models/User");
var Comment = require("../models/Comment");
var router = express.Router();

/* GET users listing. */
var checkUser = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};
router.get("/", checkUser, async function (req, res, next) {
  const postCount = await Post.countDocuments({ author: req.session.user.id });
  const user = await User.findById(req.session.user.id);
  const favBloggerCount = user.favoriteB.length;
  const giveCommentCount = await Comment.countDocuments({
    commenter: req.session.user.id,
  });
  const getCommentCount = await Comment.countDocuments({
    author: req.session.user.id,
  });
  console.log(postCount);
  res.render("user/index", {
    postCount: postCount,
    favBloggerCount: favBloggerCount,
    giveCommentCount: giveCommentCount,
    getCommentCount: getCommentCount,
  });
});

router.get("/postadd", checkUser, function (req, res) {
  res.render("user/postadd");
});

router.post(
  "/postadd",
  checkUser,
  upload.single("image"),
  async function (req, res) {
    var post = new Post();
    post.title = req.body.title;
    post.content = req.body.content;
    post.author = req.session.user.id;
    if (req.file) post.image = "/images/uploads/" + req.file.filename;
    const data = await post.save();
    console.log(data);
    res.redirect("/users/postlist");
  }
);

router.get("/postlist", checkUser, async function (req, res) {
  const posts = await Post.find({ author: req.session.user.id }).populate(
    "author"
  );
  console.log(posts);
  res.render("user/postlist", { posts: posts });
});

router.get("/postdetail/:id", checkUser, async function (req, res) {
  const post = await Post.findById(req.params.id).populate("author");
  const comments = await Comment.find({ post: req.params.id }).populate(
    "commenter",
    "name"
  );
  res.render("user/postdetail", { post: post, comments: comments });
});

router.get("/postupdate/:id", checkUser, async function (req, res) {
  const post = await Post.findById(req.params.id);
  res.render("user/postupdate", { post: post });
});

router.post(
  "/postupdate",
  checkUser,
  upload.single("image"),
  async function (req, res) {
    var update = {
      title: req.body.title,
      content: req.body.content,
      updated: Date.now(),
    };
    if (req.file) {
      const path = "public";
      const post = await Post.findById(req.body.id);
      try {
        fs.unlinkSync(path + post.image);
      } catch (e) {
        console.log("Image delete error");
      }
      update.image = "/images/uploads/" + req.file.filename;
    }
    const data = await Post.findByIdAndUpdate(req.body.id, { $set: update });
    res.redirect("/users/postlist");
  }
);

router.get("/postdelete/:id", checkUser, async function (req, res) {
  const data = await Post.findByIdAndDelete(req.params.id);
  console.log(data);
  const path = "public";
  if (data.image) {
    try {
      fs.unlinkSync(path + data.image);
    } catch (e) {
      console.log("Image delete error");
    }
  }
  res.redirect("/users/postlist");
});

router.post("/givelike", checkUser, async function (req, res) {
  if (req.body.option == "like") {
    try {
      const data = await Post.findByIdAndUpdate(req.body.id, {
        $push: { like: { user: req.session.user.id } },
      });
      res.json({ status: true });
    } catch (e) {
      res.json({ status: false });
    }
  } else {
    try {
      const post = await Post.findById(req.body.id);
      const likelist = post.like.filter(function (data) {
        return data.user != req.session.user.id;
      });
      const data = await Post.findByIdAndUpdate(req.body.id, {
        $set: { like: likelist },
      });
      res.json({ status: true });
    } catch (e) {
      res.json({ status: false });
    }
  }
});

router.post("/givecomment", checkUser, async function (req, res) {
  var comment = new Comment();
  comment.post = req.body.pid;
  comment.comment = req.body.comment;
  comment.author = req.body.aid;
  comment.commenter = req.session.user.id;
  try {
    const data = await comment.save();
    res.json({ status: true });
  } catch (e) {
    res.json({ status: false });
  }
});

router.post("/givereply", checkUser, async function (req, res) {
  try {
    const data = await Comment.findByIdAndUpdate(req.body.cid, {
      $set: { reply: req.body.reply, updated: Date.now() },
    });
    res.json({ status: true });
  } catch (e) {
    res.json({ status: false });
  }
});

router.post("/givefav", checkUser, async function (req, res) {
  if (req.body.option == "fav") {
    try {
      const data = await User.findByIdAndUpdate(req.session.user.id, {
        $push: { favoriteB: { blogger: req.body.aid } },
      });
      res.json({ status: true });
    } catch (e) {
      console.log(e);
      res.json({ status: false });
    }
  } else {
    try {
      const user = await User.findById(req.session.user.id);
      const bloglist = user.favoriteB.filter(function (data) {
        return data.blogger != req.body.aid;
      });
      console.log(bloglist);
      const data = await User.findByIdAndUpdate(req.session.user.id, {
        $set: { favoriteB: bloglist },
      });
      res.json({ status: true });
    } catch (e) {
      console.log(e);
      res.json({ status: false });
    }
  }
});

router.get("/favbloglist", checkUser, async function (req, res) {
  const user = await User.findById(req.session.user.id);
  let favlist = [];
  user.favoriteB.forEach((element) => {
    favlist.push(element.blogger);
  });
  const posts = await Post.find({ author: { $in: favlist } }).populate(
    "author",
    "name"
  );
  res.render("favbloglist", { posts: posts });
});

module.exports = router;
