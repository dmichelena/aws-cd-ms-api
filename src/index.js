const sns = require('aws-lambda-sns');
const api = require('lambda-api')();

api.post('/order', async (req, res) => {
  await sns.emit('paid_order', req.body);

  return {status: 'OK'};
});
api.post('/user', async (req, res) => {
  await sns.emit('user_registered', req.body);

  return {status: 'OK'};
});

exports.handler = async (event, context) => {
  return await api.run(event, context);
};