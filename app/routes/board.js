const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const Comment = require('../models/comment');

// 📄 전체 게시글 불러오기
router.get('/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

// 📝 새 게시글 작성
router.post('/posts', async (req, res) => {
  const newPost = new Post(req.body);
  await newPost.save();
  res.status(201).json(newPost);
});

// 💬 댓글 불러오기
router.get('/comments/:postId', async (req, res) => {
  const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 });
  res.json(comments);
});

// 💬 댓글 작성
router.post('/comments', async (req, res) => {
  const newComment = new Comment(req.body);
  await newComment.save();
  res.json({ success: true });
});

module.exports = router;