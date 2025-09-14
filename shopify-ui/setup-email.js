#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Email Configuration Setup\n');

const questions = [
  {
    key: 'provider',
    question: 'Choose email provider (1: Gmail, 2: SendGrid, 3: Mailgun): ',
    options: ['gmail', 'sendgrid', 'mailgun']
  },
  {
    key: 'email',
    question: 'Enter your email address: ',
    required: true
  },
  {
    key: 'password',
    question: 'Enter your email password/API key: ',
    required: true
  },
  {
    key: 'from',
    question: 'Enter FROM email (press Enter to use same as email): ',
    required: false
  }
];

const configs = {
  gmail: {
    host: 'smtp.gmail.com',
    port: '587'
  },
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: '587',
    user: 'apikey'
  },
  mailgun: {
    host: 'smtp.mailgun.org',
    port: '587'
  }
};

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question.question, (answer) => {
      if (question.required && !answer.trim()) {
        console.log('❌ This field is required!');
        askQuestion(question).then(resolve);
      } else {
        resolve(answer.trim());
      }
    });
  });
}

async function setupEmail() {
  try {
    const answers = {};
    
    // Ask provider
    const providerChoice = await askQuestion(questions[0]);
    const providerIndex = parseInt(providerChoice) - 1;
    
    if (providerIndex < 0 || providerIndex >= questions[0].options.length) {
      console.log('❌ Invalid choice!');
      process.exit(1);
    }
    
    answers.provider = questions[0].options[providerIndex];
    
    // Ask other questions
    for (let i = 1; i < questions.length; i++) {
      answers[questions[i].key] = await askQuestion(questions[i]);
    }
    
    // Set defaults
    if (!answers.from) {
      answers.from = answers.email;
    }
    
    if (answers.provider === 'sendgrid') {
      answers.user = 'apikey';
    } else {
      answers.user = answers.email;
    }
    
    // Generate secret
    const secret = require('crypto').randomBytes(32).toString('base64');
    
    // Create .env.local content
    const envContent = `# NextAuth Configuration
NEXTAUTH_SECRET=${secret}
NEXTAUTH_URL=http://localhost:3000

# Email Configuration
EMAIL_SERVER_HOST=${configs[answers.provider].host}
EMAIL_SERVER_PORT=${configs[answers.provider].port}
EMAIL_SERVER_USER=${answers.user}
EMAIL_SERVER_PASSWORD=${answers.password}
EMAIL_FROM=${answers.from}
`;

    // Write to .env.local
    fs.writeFileSync('.env.local', envContent);
    
    console.log('\n✅ Email configuration saved to .env.local');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Go to http://localhost:3000/auth/signin');
    console.log('3. Try the magic link authentication!');
    
    if (answers.provider === 'gmail') {
      console.log('\n⚠️  Gmail users: Make sure you have:');
      console.log('- Enabled 2-factor authentication');
      console.log('- Generated an App Password (not your regular password)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

setupEmail();
