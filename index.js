const dotenv = require('dotenv');
const winston = require('winston');
const request = require('request');
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs-extra');
const path = require('path');
const app = express();
const port = 3000;

dotenv.config();

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
  uri: `http://0.0.0.0:3030/c/${resource}/${action}`,
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

  fs.outputFile(outputPath, JSON.stringify(req.body), 'utf8', () => {});

  switch (event) {
    case 'pull_request_opened':
      if (req.body.pull_request.mergable instanceof String) {
        req.body.pull_request.mergable = false;
      }
      return sendCommand('pull-request', 'open', req.body);
    case 'pull_request_assigned':
      if (req.body)
      return sendCommand('pull-request', 'assign', req.body);
    default:
      break;
  }
})

app.listen(port, () => console.log(`Isla listening on port ${port}!`))