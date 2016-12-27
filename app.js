var loginButton = document.querySelector('#login-button');
var quoteButton = document.querySelector('#quote-button');
var secretQuoteButton = document.querySelector('#secret-quote-button');

var quoteClickStream = Rx.Observable.fromEvent(quoteButton, 'click');
var secretQuoteClickStream = Rx.Observable.fromEvent(secretQuoteButton, 'click');
var loginClickStream = Rx.Observable.fromEvent(loginButton, 'click');

var quoteStream = quoteClickStream
  .map(function() {
    return {
      route: 'http://localhost:3001/api/random-quote'
    }
  });

var quoteResponseStream = quoteStream
  .flatMap(function(request) {
    return fetchQuote(request);
  });

function fetchQuote(request) {
  return fetch(request.route)
    .then(function(data) {
      return data.text()
        .then(function(text) {
        return text;
      });
    });
}

quoteResponseStream.subscribe(function(text) {
  document.querySelector('h1').innerHTML = text;
})


// Setting up Auth Streams

var loginStream = loginClickStream
  .map(function() {
    var loginPath = 'http://localhost:3001/sessions/create';
    var username = document.querySelector('#username').value;
    var password = document.querySelector('#password').value;
    var method = 'POST';
    var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    return {
      loginPath: loginPath,
      username: username,
      password: password,
      method: method,
      headers: headers
    }
  })
  .authenticate(function(config) {
    return config;
  });

Rx.Observable.prototype.authenticate = function(config) {
  function getJwt(config) {
    var body;

    if(config.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
      body = 'username=' + config.username + '&password=' + config.password;
    }
  }
}
