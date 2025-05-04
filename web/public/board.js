// HTML 요소 선택
const postList = document.getElementById('post-list');
const postForm = document.getElementById('post-form');
const postTitle = document.getElementById('post-title');
const postContent = document.getElementById('post-content');
const writePostBtn = document.getElementById('write-post-btn');
const latestPosts = document.getElementById('latest-posts');
const fixedPosts = document.getElementById('fixed-posts');
const bottomBar = document.getElementById('bottom-bar');
const hotPostList = document.getElementById('hot-post-list');

const commentList = document.getElementById('comment-list');
const commentForm = document.getElementById('comment-form');
const commentContent = document.getElementById('comment-content');

let currentPostId = null;

// Hot Posts 로드
async function loadHotPosts() {
  try {
    const res = await fetch('/api/hot-posts');
    const posts = await res.json();
    
    hotPostList.innerHTML = '';
    const leftList = document.createElement('ul');
    const rightList = document.createElement('ul');
    
    posts.forEach((post, index) => {
      const li = document.createElement('li');
      li.classList.add('post-item');
      
      const title = document.createElement('div');
      title.textContent = `${index + 1}. ${post.title}`;
      title.classList.add('post-title');
      
      li.appendChild(title);
      li.onclick = () => showPostDetail(post);
      
      if (index < 5) {
        leftList.appendChild(li);
      } else {
        rightList.appendChild(li);
      }
    });
    
    hotPostList.appendChild(leftList);
    hotPostList.appendChild(rightList);
  } catch (err) {
    console.error('Failed to load hot posts:', err);
  }
}

// 글쓰기 버튼 클릭 시 폼 표시
writePostBtn.addEventListener("click", () => {
  latestPosts.style.display = "none";
  fixedPosts.style.display = "none";
  bottomBar.style.display = "none";
  postForm.style.display = "block";
});

// 취소 버튼 클릭 시 폼 숨김
document.getElementById("cancel-post").addEventListener("click", () => {
  latestPosts.style.display = "block";
  fixedPosts.style.display = "block";
  bottomBar.style.display = "flex";
  postForm.style.display = "none";
  postForm.reset();
});

// 게시글 목록 가져오기
async function loadPosts() {
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();

    postList.innerHTML = '';
    posts.forEach(post => {
      const li = document.createElement('li');
      li.classList.add('post-item');
    
      const title = document.createElement('div');
      title.textContent = post.title;
      title.classList.add('post-title');
      
      li.appendChild(title);
      li.onclick = () => showPostDetail(post);
      postList.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load posts:', err);
  }
}

// 게시글 작성
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!postTitle.value.trim() || !postContent.value.trim()) {
    return alert('Please enter both a title and content.');
  }
  
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: postTitle.value.trim(),
        content: postContent.value.trim()
      })
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    postForm.reset();
    postForm.style.display = "none";
    latestPosts.style.display = "block";
    fixedPosts.style.display = "block";
    bottomBar.style.display = "flex";
    loadPosts();
    loadHotPosts();
  } catch (err) {
    console.error('Failed to save post:', err);
    alert('An error occurred while saving your post.');
  }
});

// 게시글 상세 보기
async function showPostDetail(post) {
  // 게시글 조회 시 점수 증가
  await fetch(`/api/posts/${post._id}`);
  
  // 기존 상세 보기 요소 제거
  const existingDetail = document.querySelector('.post-detail');
  if (existingDetail) {
    existingDetail.remove();
  }

  // 새 상세 보기 요소 생성
  const detailView = document.createElement('div');
  detailView.classList.add('post-detail');
  detailView.style.display = 'block';
  
  // 뒤로가기 버튼
  const backBtn = document.createElement('button');
  backBtn.classList.add('back-btn');
  backBtn.textContent = '← Back to List';
  backBtn.onclick = () => {
    detailView.remove();
    document.getElementById('latest-posts').style.display = 'block';
    document.getElementById('fixed-posts').style.display = 'block';
    bottomBar.style.display = 'flex';
    loadHotPosts();
  };
  
  // 제목과 내용
  const title = document.createElement('h3');
  title.textContent = post.title;
  
  const content = document.createElement('div');
  content.classList.add('content');
  content.textContent = post.content;
  
  // 댓글 섹션
  const commentsSection = document.createElement('div');
  commentsSection.classList.add('comments-section');
  
  const commentForm = document.createElement('form');
  commentForm.classList.add('comment-form');
  commentForm.innerHTML = `
    <input type="text" placeholder="Write a comment..." required>
    <button type="submit">Post Comment</button>
  `;
  
  const commentList = document.createElement('ul');
  commentList.classList.add('comment-list');
  
  // 요소 조립
  detailView.appendChild(backBtn);
  detailView.appendChild(title);
  detailView.appendChild(content);
  commentsSection.appendChild(commentForm);
  commentsSection.appendChild(commentList);
  detailView.appendChild(commentsSection);
  
  // 화면에 표시
  document.getElementById('latest-posts').style.display = 'none';
  document.getElementById('fixed-posts').style.display = 'block'; // Hot Posts 섹션 표시
  bottomBar.style.display = 'none';
  
  // 상세 보기를 latest-posts 섹션 앞에 삽입
  const latestPosts = document.getElementById('latest-posts');
  latestPosts.parentNode.insertBefore(detailView, latestPosts);
  
  // 댓글 입력창에 포커스
  setTimeout(() => {
    const input = commentForm.querySelector('input');
    if (input) input.focus();
  }, 0);

  // 댓글 작성 이벤트
  commentForm.onsubmit = async (e) => {
    e.preventDefault();
    const input = commentForm.querySelector('input');
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post._id,
          content: content
        })
      });
      
      if (!res.ok) throw new Error('Failed to save comment');
      
      loadComments(post._id, commentList);
      input.value = '';
      loadHotPosts();
      
    } catch (err) {
      console.error('Failed to save comment:', err);
      alert('An error occurred while saving your comment.');
    }
  };
  
  // 기존 댓글 로드
  loadComments(post._id, commentList);
}

// 댓글 목록 불러오기
async function loadComments(postId, commentList) {
  try {
    const res = await fetch(`/api/comments/${postId}`);
    const comments = await res.json();
    
    commentList.innerHTML = '';
    comments.forEach(comment => {
      const li = document.createElement('li');
      li.textContent = `${comment.number}> ${comment.content}`;
      commentList.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load comments:', err);
  }
}

// 초기 로딩
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  loadHotPosts();
  latestPosts.style.display = "block";
  fixedPosts.style.display = "block";
});
