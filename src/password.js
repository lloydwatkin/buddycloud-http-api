/*
 * Copyright 2012 Denis Washington <denisw@online.de>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// password.js:
// Handles password-related requests (/account/pw/).

var config = require('./util/config')
  , session = require('./util/session')
  , api = require('./util/api')
  , ltx = require('ltx')

/**
 * Registers resource URL handlers.
 */
exports.setup = function(app) {
  app.post('/account/pw/change',
           api.bodyReader,
           session.provider,
           changePassword);
  app.post('/account/pw/reset',
           api.bodyReader,
           session.provider,
           resetPassword);
};

//// POST /account/pw/change /////////////////////////////////////////////////////////////

function changePassword(req, res) {
  try {
    var pwChange = JSON.parse(req.body);
  } catch (e) {
    res.send(400);
  }

  var username = pwChange['username'];
  var password = pwChange['password'];

  if (!username || !password) {
    res.send(400);
    return;
  }

  var domain = null;

  if (username.indexOf("@") == -1) {
    domain = config.xmppDomain;
  } else {
    var splitUsername = username.split('@');
    username = splitUsername[0];
    domain = splitUsername[1];
  }

  var pwChangeIq = createPasswordChangeIQ(username, password);
  api.sendQueryToXmpp(req, res, pwChangeIq, domain, function(reply) {
    res.send(200);
  });
}

function createPasswordChangeIQ(username, password) {
  var queryNode = new ltx.Element('iq', {type: 'set'}).c('query', {xmlns: 'jabber:iq:register'});
  queryNode.c('username').t(username);
  queryNode.c('password').t(password);
  return queryNode.root();
}

//// POST /account/pw/reset /////////////////////////////////////////////////////////////

function resetPassword(req, res) {
  try {
    var pwReset = JSON.parse(req.body);
  } catch (e) {
    res.send(400);
  }

  var username = pwReset['username'];

  if (!username) {
    res.send(400);
    return;
  }

  if (username.indexOf("@") == -1) {
    username = [username, '@', config.xmppDomain].join('');
  }

  var pwResetIq = createPasswordResetIQ(username);
  api.sendQueryToPusher(req, res, pwResetIq, function(reply) {
    res.send(200);
  });
}

function createPasswordResetIQ(username) {
  var queryNode = new ltx.Element('iq', { type: 'set' }).c('query',
      {xmlns: 'http://buddycloud.com/pusher/password-reset'});
  queryNode.c('username').t(username);
  return queryNode.root();
}
