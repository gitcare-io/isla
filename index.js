const winston = require('winston');
const request = require('request');
const express = require('express')
const config = require('config');
const bodyParser = require('body-parser')
const fs = require('fs-extra');
const path = require('path');
const app = express();

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.prettyPrint()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const sendCommand = (resource, action, eventBody) => request({
  uri: `${config.get('antonUrl')}/c/${resource}/${action}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(eventBody)
});

app.use(bodyParser.json())

app.post('/', (req, res) => {
  const event = `${req.headers['x-github-event']}${req.body.action ? '_' + req.body.action : ''}`;
  const outputPath = path.resolve(
    __dirname,
    'events',
    req.headers['x-github-event'],
    req.body.action || '',
    `${new Date().getTime()}.json`
  );

  logger.log('info', `event, ${event}, ${outputPath.split('/').reverse()[0]}`);

  if (process.env.NODE_ENV === 'development') {
    fs.outputFileSync(outputPath, JSON.stringify(req.body), 'utf8');
  }

  switch (event) {
    case 'pull_request_opened':
      return sendCommand('pull-request', 'open', req.body);
    case 'pull_request_assigned':
      if (req.body)
      return sendCommand('pull-request', 'assign', req.body);
    case 'pull_request_closed':
      if (req.body)
      return sendCommand('pull-request', 'close', req.body);
    default:
      break;
  }
})

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Isla listening on port ${port}!`))