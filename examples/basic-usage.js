/**
 * Basic Gmail Connector Usage Example
 * 
 * This example demonstrates how to set up and use the Gmail connector
 * for basic email operations like listing and reading messages.
 */

const GmailConnector = require('../src/connector');

async function basicExample() {
  // Initialize the connector with OAuth2 authentication
  const connector = new GmailConnector({
    auth: {
      type: 'oauth2',
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN
    },
    retry: {
      maxAttempts: 3,
      backoffBase: 1000
    },
    logging: {
      level: 'info'
    }
  });

  try {
    console.log('Fetching recent messages...');
    
    // List recent messages from inbox
    const messageList = await connector.listMessages({
      maxResults: 10,
      labelIds: ['INBOX']
    });

    console.log(`Found ${messageList.messages?.length || 0} messages`);

    // Get details for the first message
    if (messageList.messages && messageList.messages.length > 0) {
      const firstMessageId = messageList.messages[0].id;
      const message = await connector.getMessage(firstMessageId);
      
      console.log('First message details:');
      console.log(`- ID: ${message.id}`);
      console.log(`- Thread ID: ${message.threadId}`);
      console.log(`- Snippet: ${message.snippet}`);
      
      // Extract basic headers
      const headers = message.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown sender';
      
      console.log(`- Subject: ${subject}`);
      console.log(`- From: ${from}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    
    // Handle specific error types
    if (error.message.includes('unauthorized')) {
      console.error('Authentication failed. Check your OAuth2 credentials.');
    } else if (error.message.includes('quota')) {
      console.error('API quota exceeded. Please try again later.');
    }
  }
}

// Run the example
if (require.main === module) {
  basicExample().catch(console.error);
}

module.exports = basicExample;