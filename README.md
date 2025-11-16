# Mudskipper QMS

Quality Management System for document management, task tracking, and operational data.

## What's Implemented

- **Admin User Management**: Invite users via email with permission levels (1-5), edit user permissions, and view all users. Only Level 5 (Super Admin) can access admin features.

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: AWS Amplify Gen 2
- **Authentication**: AWS Cognito User Pools
- **Database**: Amazon DynamoDB
- **Serverless Functions**: AWS Lambda

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the sandbox:
   ```bash
   npx ampx sandbox
   ```

## Usage

Access the `/admin` page to invite users and manage permissions. Only Level 5 (Super Admin) users can access this page.

## Documentation

- **Requirements**: See `documents/REQUIREMENTS.md` for full feature specifications
- **Architecture & Patterns**: See `documents/AI_AGENTS.md` for detailed architecture, patterns, and development guidelines

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
