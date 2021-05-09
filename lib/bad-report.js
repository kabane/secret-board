'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  'postgres://user:postgres@localhost/secret_board',
  {
    logging: false
  }
);

var Post = require('./post');

const BadReport = sequelize.define(
  'BadReport',
  {
    id:   {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    postId: {
      type: Sequelize.INTEGER
    },
    reportedBy: {
      type: Sequelize.STRING
    }
  },
  {
    freezeTableName: true,
    timestamps: true
  }
);

BadReport.belongsTo(Post, {foreignKey: 'postId'});
BadReport.sync();
module.exports = BadReport;