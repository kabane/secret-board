'use strict';
const crypto = require('crypto');
const pug = require('pug');
const Cookies = require('cookies');
const util = require('./handler-util');
const Post = require('./post');

const trackingIdKey = 'tracking_id';

const oneTimeTokenMap = new Map();

function handle(req, res) {
  const cookies = new Cookies(req, res);
  const trackingId = addTrackingCookie(cookies, req.user);

  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      Post.findAll().then((posts) => {
        const oneTimeToken = crypto.randomBytes(8).toString('hex');
        oneTimeTokenMap.set(req.user, oneTimeToken);
        res.end(pug.renderFile('./views/posts.pug', {
          posts: posts,
          user: req.user,
          oneTimeToken: oneTimeToken
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
          const matchResult = decoded.match(/content=(.*)&oneTimeToken=(.*)/);
          if (!matchResult) {
            util.handleBadRequest(req, res);
          } else {
            const content = matchResult[1];
            const requestedOneTimeToken = matchResult[2];
            if (oneTimeTokenMap.get(req.user) === requestedOneTimeToken) {
              console.info('投稿されました: ' + content);
              Post.create({
                content: content,
                trackingCookie: trackingId,
                postedBy: req.user
              }).then(() => {
                oneTimeTokenMap.delete(req.user);
                handleRedirectPosts(req, res);
              });
            } else {
              util.handleBadRequest(req, res);
            }
          }
        });
      break;
    default:
      util.handleNotFound(req, res);
      break;
  }
}

function handleDelete(req, res) {
  switch (req.method) {
    case 'POST':
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString();
        const decoded = decodeURIComponent(body);
        const id = decoded.split('id=')[1];
        Post.findByPk(id).then((post) => {
          if (req.user === post.postedBy || req.user === 'admin') {
            post.destroy().then(() => {
              handleRedirectPosts(req, res);
            });
          }
        });
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    Location: '/posts'
  });
  res.end();
}


function addTrackingCookie(cookies, userName) {
  const requestedTrackingId = cookies.get(trackingIdKey);
  if (isValidTrackingId(requestedTrackingId, userName)) {
    return requestedTrackingId;
  } else {
    const originalId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    const tomorrow = new Date(Date.now() + (1000 * 60 * 60 * 24));
    const trackingId = originalId + '_' + createValidHash(originalId, userName);
    cookies.set(trackingIdKey, trackingId, { expires: tomorrow });
    return trackingId;
  }
}

function isValidTrackingId(trackingId, userName) {
  if (!trackingId) {
    return false;
  }
  const splitted = trackingId.split('_');
  const originalId = splitted[0];
  const requestedHash = splitted[1];
  return createValidHash(originalId, userName) === requestedHash;
}

function createValidHash(originalId, userName) {
  const sha1sum = crypto.createHash('sha1');
  sha1sum.update(originalId + userName);
  return sha1sum.digest('hex');
}


module.exports = {
  handle,
  handleDelete
};