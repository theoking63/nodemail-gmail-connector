# NodeMail Gmail Connector

Enterprise-grade Gmail API connector with advanced authentication and retry logic for Node.js applications.

## Features

- 🔐 **Advanced Authentication**: OAuth2, Service Account, and delegated authentication support
- 🔄 **Smart Retry Logic**: Exponential backoff with intelligent error handling
- 📧 **Batch Operations**: Efficient bulk email processing with rate limiting
- 📊 **Monitoring**: Built-in logging and performance metrics
- 🏢 **Enterprise Ready**: Designed for high-volume production environments

## Installation

```bash
npm install nodemail-gmail-connector
```

## Quick Start

```javascript
const GmailConnector = require('nodemail-gmail-connector');

const connector = new GmailConnector({
  auth: {
    type: 'oauth2',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    refreshToken: 'your-refresh-token'
  }
});

// List recent messages
const messages = await connector.listMessages({
  maxResults: 10,
  labelIds: ['INBOX']
});

console.log(messages);
```

## Authentication Methods

### OAuth2 Authentication
```javascript
const connector = new GmailConnector({
  auth: {
    type: 'oauth2',
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN
  }
});
```

### Service Account Delegation
```javascript
const connector = new GmailConnector({
  auth: {
    type: 'service_account',
    keyFile: './service-account-key.json',
    subject: 'user@domain.com'
  }
});
```

## API Reference

### Methods

- `listMessages(options)` - List messages with filtering
- `getMessage(messageId)` - Get message details
- `sendMessage(message)` - Send email message
- `batchGetMessages(messageIds)` - Batch retrieve messages
- `createLabel(label)` - Create custom label
- `deleteMessage(messageId)` - Delete message

### Error Handling

The connector includes intelligent error handling for common Gmail API issues:

- **Rate Limiting**: Automatic retry with exponential backoff
- **Authentication Errors**: Token refresh and re-authentication
- **Network Issues**: Connection retry logic
- **Quota Exceeded**: Graceful degradation

## Configuration

```javascript
const connector = new GmailConnector({
  auth: { /* authentication config */ },
  retry: {
    maxAttempts: 3,
    backoffBase: 1000,
    maxBackoff: 30000
  },
  rateLimit: {
    requestsPerSecond: 10,
    burstLimit: 100
  },
  logging: {
    level: 'info',
    format: 'json'
  }
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://docs.nodemail.dev/gmail-connector)
- 🐛 [Issue Tracker](https://github.com/tenebraking/nodemail-gmail-connector/issues)
- 💬 [Discussions](https://github.com/tenebraking/nodemail-gmail-connector/discussions)

---

**NodeMail Gmail Connector** - Trusted by enterprise teams at Slack, Notion, and Zapier for reliable Gmail integration.