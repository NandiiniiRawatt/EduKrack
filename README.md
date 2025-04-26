# EduKrack

EduKrack is an innovative educational platform that converts complex topics into interactive video lessons using AI technology. This application provides a user-friendly interface for students to learn various educational concepts through conversational AI.

## Features

- **AI-Powered Content Conversion**: Transform any educational topic into comprehensive video lessons
- **User-Friendly Interface**: Clean, responsive design for both desktop and mobile users
- **Dark/Light Theme**: Toggle between themes for comfortable viewing in any environment
- **Authentication System**: Secure user login and account management
- **Interactive Chat**: Conversational interface for educational queries

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js with Express
- **Database**: SQLite3
- **AI Integration**: OpenAI GPT API
- **Authentication**: Custom authentication system

## Installation

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/nandiiniirawatt/EduKrack.git
cd EduKrack
```

2. Install the dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```
openai_key=your_openai_api_key_here
```

4. Start the server:
```bash
node server.js
```

5. Access the application at:
```
http://localhost:3000
```

## Project Structure

- `/public` - Contains all frontend files (HTML, CSS, client-side JS)
- `/css` - Stylesheet files
- `server.js` - Main application server file
- `package.json` - Project dependencies and configuration

## Usage

1. Navigate to the landing page
2. Use the "Convert" feature to input an educational topic
3. Interact with the AI to get your topic converted into video lesson content
4. Toggle between light and dark themes using the theme toggle button

## Screenshots

[Include screenshots of your application here]

## Future Enhancements

- User profiles with learning progress tracking
- Content sharing capabilities
- Integration with video generation APIs
- Mobile application
- Advanced analytics on user learning patterns

## License

[Include your license information here]

## Contributors

- Nandinii Rawat
- Servesh Khandwe

---

Made with ❤️ by Nandiinii Rawatt and Servesh Khandwe