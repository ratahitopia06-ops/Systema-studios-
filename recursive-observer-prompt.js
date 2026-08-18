'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SYSTEM_PROMPT = fs
  .readFileSync(path.join(__dirname, 'great-works-prompt.txt'), 'utf8')
  .trim();

const AGENT_NAME = 'The Great Works';
const DEFAULT_MODEL = 'gpt-5';
const MAX_HISTORY_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 12000;

module.exports = {
  AGENT_NAME,
  DEFAULT_MODEL,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_LENGTH,
  SYSTEM_PROMPT,
};
