const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const retry = require('retry');
const winston = require('winston');

class GmailConnector {
  constructor(config = {}) {
    this.config = {
      retry: {
        maxAttempts: 3,
        backoffBase: 1000,
        maxBackoff: 30000,
        ...config.retry
      },
      rateLimit: {
        requestsPerSecond: 10,
        burstLimit: 100,
        ...config.rateLimit
      },
      logging: {
        level: 'info',
        format: 'json',
        ...config.logging
      },
      ...config
    };

    this.logger = winston.createLogger({
      level: this.config.logging.level,
      format: winston.format.json(),
      transports: [
        new winston.transports.Console()
      ]
    });

    this.auth = this._setupAuth(config.auth);
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
    this.rateLimiter = this._setupRateLimit();
  }

  _setupAuth(authConfig) {
    if (!authConfig) {
      throw new Error('Authentication configuration required');
    }

    switch (authConfig.type) {
      case 'oauth2':
        return this._setupOAuth2(authConfig);
      case 'service_account':
        return this._setupServiceAccount(authConfig);
      default:
        throw new Error(`Unsupported auth type: ${authConfig.type}`);
    }
  }

  _setupOAuth2(config) {
    const oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    if (config.refreshToken) {
      oauth2Client.setCredentials({
        refresh_token: config.refreshToken
      });
    }

    return oauth2Client;
  }

  _setupServiceAccount(config) {
    const auth = new google.auth.GoogleAuth({
      keyFile: config.keyFile,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify'
      ],
      subject: config.subject
    });

    return auth;
  }

  _setupRateLimit() {
    const tokens = this.config.rateLimit.burstLimit;
    const refillRate = this.config.rateLimit.requestsPerSecond;
    
    return {
      tokens,
      lastRefill: Date.now(),
      refillRate
    };
  }

  async _executeWithRetry(operation, operationName) {
    const operation_retry = retry.operation({
      retries: this.config.retry.maxAttempts - 1,
      factor: 2,
      minTimeout: this.config.retry.backoffBase,
      maxTimeout: this.config.retry.maxBackoff
    });

    return new Promise((resolve, reject) => {
      operation_retry.attempt(async (currentAttempt) => {
        try {
          this.logger.info(`Executing ${operationName}, attempt ${currentAttempt}`);
          const result = await operation();
          resolve(result);
        } catch (error) {
          this.logger.warn(`${operationName} failed on attempt ${currentAttempt}:`, error.message);
          
          if (operation_retry.retry(error)) {
            return;
          }
          
          reject(operation_retry.mainError());
        }
      });
    });
  }

  async listMessages(options = {}) {
    return this._executeWithRetry(async () => {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        ...options
      });
      return response.data;
    }, 'listMessages');
  }

  async getMessage(messageId) {
    return this._executeWithRetry(async () => {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId
      });
      return response.data;
    }, 'getMessage');
  }

  async sendMessage(message) {
    return this._executeWithRetry(async () => {
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: message
      });
      return response.data;
    }, 'sendMessage');
  }

  async batchGetMessages(messageIds) {
    return this._executeWithRetry(async () => {
      const batch = google.gmail({
        version: 'v1',
        auth: this.auth
      });

      const requests = messageIds.map(id => ({
        method: 'GET',
        path: `/gmail/v1/users/me/messages/${id}`
      }));

      const response = await batch.batch(requests);
      return response.data;
    }, 'batchGetMessages');
  }
}

module.exports = GmailConnector;