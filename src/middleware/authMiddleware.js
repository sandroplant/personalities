function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.access_token) {
      // User is authenticated; proceed to the next middleware or route
      next();
    } else {
      // User is not authenticated; redirect to the login page
      res.redirect('/login');
    }
  }
  
  module.exports = ensureAuthenticated;
  