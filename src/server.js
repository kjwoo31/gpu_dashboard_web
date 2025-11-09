const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const apiRouter = require('./routes/api');
const { loadData } = require('./utils/dataService');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// 세션 설정
app.use(session({
  secret: 'gpu-control-hub-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24시간
}));

// API 라우트
app.use('/api', apiRouter);

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 서버 시작
async function startServer() {
  await loadData();
  app.listen(PORT, () => {
    console.log(`GPU Control Hub running on http://localhost:${PORT}`);
  });
}

startServer();
