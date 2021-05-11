'use strict';
const pug = require('pug');
const util = require('./handler-util');
const BadReport = require('./bad-report');
const Post = require('./post');


function handle(req, res) {
  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      BadReport.findAll({
        include: [
          {
            model: Post,
            attributes: ['content']
          }
        ]
      }).then((badReports) => {
        console.log(JSON.stringify(badReports))
        res.end(pug.renderFile('./views/badReports.pug', {
          badReports: badReports,
          user: req.user
        }))
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
          const postId = decoded.split('postId=')[1];
          BadReport.create({
            postId: postId,
            reportedBy: req.user
          }).then(() => {
            res.writeHead(303, {
              Location: '/posts'
            });
            res.end();
          });
        });
      break;
    default:
      util.handleNotFound(req, res);
      break;
  }
}

module.exports = {
  handle
};