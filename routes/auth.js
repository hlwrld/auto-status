const {google} = require('googleapis');

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const valid_email = process.env.GOOGLE_EMAIL;

async function auth(request, response) {
  const authString = request.query.auth || request.body.auth;
  if (!authString) {
    throw 'Auth param not set';
  }
  const authObject = JSON.parse(authString);
  const authClient = new google.auth.OAuth2(client_id, client_secret);
  await authClient.verifyIdToken({idToken: authObject.id_token, audience: client_id});
  authClient.setCredentials(authObject);
  const oauth2 = google.oauth2({
    auth: authClient,
    version: 'v2'
  });
  const userInfo = await oauth2.userinfo.v2.me.get();
  const email = userInfo.data.email;
  if (email !== valid_email) {
    throw 'Invalid Email: ' + email;
  }
  response.locals.googleAuthClient = authClient;
}

module.exports.isAuthorized = function (request, response, next) {
  auth(request, response)
    .then(next)
    .catch(error => {
      console.error(error);
      response.sendStatus(401);
    });
};
