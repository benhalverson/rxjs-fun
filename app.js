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

  if(request.jwt) {
    var config = {
      headers: {
        "Authorization": "Bearer: " + request.jwt
      }
    }
    console.log('config', config);
  }
  return fetch(request.route)
    .then(function(data) {
      return data.text()
        .then(function(text) {
        return text;
      });
    })
    .catch(function(error) {
      console.log('Error' + error);
    });
}

quoteResponseStream.subscribe(function(text) {
  document.querySelector('h1').innerHTML = text;
})


// Setting up Auth Streams
Rx.Observable.prototype.authenticate = function(config) {
  function getJwt(config) {
    console.log('auth config', config);
    var body;

    if(config.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
      body = 'username=' + config.username + '&password=' + config.password;

    }

    var init = {
      method: config.method,
      headers: config.headers,
      body: body
    }
    console.log('init', init);

    return fetch(config.loginPath, init)
      .then(function(data) {
        console.log('data', data);
        return data.json()
          .then(function(jwt) {
            localStorage.setItem('id-token', jwt.id_token);
          });
      })
      .catch(function(error) {
        console.log('Error', error);
      })
  }
  return this.flatMap(function(credentials) {
    console.log('credentials', credentials);
    return Rx.Observable.fromPromise(getJwt(credentials));
  });
}

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
    console.log('Config', config);
    return config;
  })
  .catch(function(err) {
    console.log('Error', err);
  });




Rx.Observable.prototype.authenticated = function(route) {
  var jwt = localStorage.getItem('id-token');

  // return the JWT if it exists
  if(jwt !== undefined && jwt !== null) {
    return this.map(function() {
      return {
        route: route,
        jwt: jwt
      }
    });
  }
  else return Rx.Observable.throw(new Error('No JWT in Local Storage'));
}

var secretQuoteStream = secretQuoteClickStream
  .authenticated('http://localhost:3001/api/protected/random-quote');

var quoteResponseStream = quoteStream
  .flatMap(function(request) {
    return fetchQuote(request);
  })
  .merge(secretQuoteStream
    .flatMap(function(request) {
      return fetchQuote(request);
    })
  );
  console.log('quoteResponseStream', quoteResponseStream);

  loginStream.subscribe();
