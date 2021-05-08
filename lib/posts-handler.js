'use strict';
const pug = require('pug');
const util = require('./handler-util');
const Post = require('./post');
const contents = [];

function handle(req, res) {
  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      Post.findAll().then((posts) => {
        res.end(pug.renderFile('./views/posts.pug', {
          posts: posts
        }));
      });
      break;
    case 'POST':
      let body = [];
      req
        .on('data', chunk => {
          body.push(chunk);
        })
        .on('end', () => {
          body = Buffer.concat(body).toString();
          const decoded = decodeURIComponent(body);
          const content = decoded.split('content=')[1];
          Post.create({
            content: content,
            trackingCookie: null,
            postedBy: req.user
          }).then(() => {
            handleRedirectPosts(req, res);
          });
        });
      break;
    default:
      util.handleNotFound(req, res);
      break;
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    Location: '/posts'
  });
  res.end();
}

module.exports = {
  handle
};