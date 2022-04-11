module.exports = function InvalidTokenException() {
  this.message = 'activation_token_invalid';
  this.status = 400;
};
