const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const Comment = require('../models/comment');

let io = null;
function setSocketIO(ioInstance) {
  io = ioInstance;
}

// 만료된 게시글의 댓글 삭제를 위한 미들웨어
async function cleanupExpiredPosts() {
  try {
    const now = new Date();
    const expiredPosts = await Post.find({ expiresAt: { $lt: now } });
    
    for (const post of expiredPosts) {
      await Comment.deleteMany({ postId: post._id });
    }
  } catch (err) {
    console.error('Failed to cleanup expired posts:', err);
  }
}

// 주기적으로 만료된 게시글 정리
setInterval(cleanupExpiredPosts, 60 * 60 * 1000); // 1시간마다 실행

// 게시글 점수 감소 함수
async function decreasePostScore() {
  const posts = await Post.find();
  const now = new Date();
  
  for (const post of posts) {
    const hoursPassed = (now - post.lastScoreUpdate) / (1000 * 60 * 60);
    if (hoursPassed >= 24) {
      const newScore = post.score * 0.5;
      post.score = newScore < 10 ? 0 : newScore;
      post.lastScoreUpdate = now;
      await post.save();
    }
  }
}

// 📄 전체 게시글 불러오기
router.get('/posts', async (req, res) => {
  await cleanupExpiredPosts(); // 만료된 게시글 정리
  await decreasePostScore();
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
  if (io) io.emit('postsUpdated', posts);
});

// 📝 새 게시글 작성
router.post('/posts', async (req, res) => {
  const newPost = new Post({
    ...req.body,
    score: 0,
    lastScoreUpdate: new Date(),
    expiresAt: new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30일 후 만료
  });
  await newPost.save();
  res.status(201).json(newPost);
  if (io) {
    const posts = await Post.find().sort({ createdAt: -1 });
    io.emit('postsUpdated', posts);
    const hotPosts = await Post.find().sort({ score: -1 }).limit(10);
    io.emit('hotPostsUpdated', hotPosts);
  }
});

// 💬 댓글 불러오기
router.get('/comments/:postId', async (req, res) => {
  const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 });
  res.json(comments);
});

// 💬 댓글 작성
router.post('/comments', async (req, res) => {
  const post = await Post.findById(req.body.postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // 댓글 번호 계산
  const commentCount = await Comment.countDocuments({ postId: req.body.postId });
  const newComment = new Comment({
    ...req.body,
    number: commentCount + 1
  });
  await newComment.save();

  // 게시글 점수 증가
  post.score += 5;
  post.lastScoreUpdate = new Date();
  await post.save();

  res.json({ success: true });
  if (io) {
    const comments = await Comment.find({ postId: req.body.postId }).sort({ createdAt: 1 });
    io.emit('commentsUpdated', { postId: req.body.postId, comments });
    const hotPosts = await Post.find().sort({ score: -1 }).limit(10);
    io.emit('hotPostsUpdated', hotPosts);
    const posts = await Post.find().sort({ createdAt: -1 });
    io.emit('postsUpdated', posts);
  }
});

// 게시글 조회 시 점수 증가
router.get('/posts/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  post.score += 2;
  post.lastScoreUpdate = new Date();
  await post.save();

  res.json(post);
  if (io) {
    const hotPosts = await Post.find().sort({ score: -1 }).limit(10);
    io.emit('hotPostsUpdated', hotPosts);
    const posts = await Post.find().sort({ createdAt: -1 });
    io.emit('postsUpdated', posts);
  }
});

// Hot Posts 가져오기
router.get('/hot-posts', async (req, res) => {
  await decreasePostScore();
  const hotPosts = await Post.find()
    .sort({ score: -1 })
    .limit(10);
  res.json(hotPosts);
  if (io) io.emit('hotPostsUpdated', hotPosts);
});

module.exports = { router, setSocketIO };