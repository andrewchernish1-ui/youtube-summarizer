// Polyfill for Request and Response
if (typeof global.Request === 'undefined') {
  global.Request = require('node-fetch').Request;
}
if (typeof global.Response === 'undefined') {
  global.Response = require('node-fetch').Response;
}
