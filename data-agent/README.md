EduAid: AI Quiz Generation 🚀
Online learning has taken the front seat in the post-pandemic age. With the advent of sophisticated AI architectures like Transformers, it is only natural that AI would find its way into education. Learning online via platforms like YouTube or MOOCs is often a method of self-learning. The biggest obstacle faced by students in self-learning is the lack of attention span. An online tool that can generate short quizzes from input educational content can be a great resource for both teachers and students. It helps retain important information, frame questions, and quickly revise large chunks of content.

EduAid is one such project currently available in the form of a browser extension.

Installation and Setup
1. Clone the Repository
git clone https://github.com/AOSSIE-Org/EduAid.git
cd EduAid
2. Backend Setup
You can choose to set up the backend manually or use an automated shell script.

Option 1: Manual Setup
Download the Sense2Vec Model:

Download the Sense2Vec model from this link and extract the contents into the backend folder.
Install Python Dependencies:

Navigate to the root repository folder and run the following command to install the required Python dependencies:
pip install -r requirements.txt
Run Flask App:

Navigate to the backend folder and start the Flask app:
python server.py
This will activate the backend for the application.
Option 2: Automated Setup with Shell Script
Run the Setup Script:
Navigate to the backend folder and run the following shell script:
./script.sh
This script will automatically download and extract the Sense2Vec model, install Python dependencies, and start the Flask app.
Troubleshooting
If the script fails to run, ensure that you have execution permissions:
chmod +x script.sh

3. Configure Google APIs
Google Docs API
Navigate to the backend folder.
Open the service_account_key.json file.
Enter the service account details for the Google Docs API.
Refer to the Google Docs API documentation for more details.
Google Forms API
Open the credentials.json file in the backend folder.
Enter the necessary credentials for the Google Forms API.
Refer to the Google Forms API quickstart guide for setup instructions.
4. Extension Setup
Install Dependencies
Navigate to the extension folder and install the required dependencies:

npm install
Build the Project
Build the extension:

npm run build
Load the Extension in Chrome
Open Chrome and navigate to chrome://extensions/.
Enable "Developer mode" (top-right corner).
Click on "Load Unpacked" and select the dist folder created in the previous step.
EduAid Web App
In addition to the browser extension, EduAid also offers a web app that provides the same powerful features for quiz generation. The web app allows you to access EduAid's capabilities directly from your browser without needing to install any extensions. Just start the backend server locally and:

Navigate to the Web App Directory: cd eduaid_web
Install Dependencies: npm install
Start the Web App: npm run start
5. Desktop App Setup
EduAid now includes a cross-platform desktop application built with Electron, providing a native desktop experience for all EduAid features.

Prerequisites
Node.js (version 16 or higher)
Backend server running (follow steps 2-3 above)
Web app built (follow step 4 above)
Development Mode
Navigate to Desktop App Directory:

cd eduaid_desktop
Install Dependencies:

npm install
Start Development Mode:

npm run dev
This will start both the web app development server and launch the Electron desktop app.

Production Build
Build Web App (if not already done):

cd eduaid_web
npm run build
Build Desktop App:

cd eduaid_desktop
npm run build:electron
Build for All Platforms:

npm run build:all
The built applications will be available in the eduaid_desktop/dist/ directory with installers for Windows (.exe), macOS (.dmg), and Linux (.AppImage).

Desktop App Features
Native Desktop Experience: Full desktop integration with native menus and keyboard shortcuts
Cross-Platform: Works on Windows, macOS, and Linux
Security: Secure communication with context isolation
Auto-Updates: Built-in support for automatic updates
Features
Dynamic Question Generation:

Boolean Questions: Quickly generate engaging true/false questions.
Multiple-Choice Questions (MCQ): Create diverse MCQs with up to 4 options for comprehensive quizzes.
Single Correct Answer Questions: Formulate questions with one clear correct answer.
Customizable Question Count: Tailor the number of questions to your needs—just select the type, set the number, and hit "Generate" to see your quiz come to life!
Quiz History at Your Fingertips:

Last 5 Quizzes: Instantly access and review the last 5 quizzes you've generated. No more losing track—your quiz history is always just a click away!
Smart Answer Generator:

Automatic Answers: Seamlessly generate answers for various question types. Toggle the switch on the Get Started page to enable or disable this feature.
MCQ Answer Magic: For MCQs, provide the options and let the tool generate the perfect answers for you.
Wiki-Based Quiz Generation:

Topic-Based Quizzes: Missing text content for a topic? Toggle the switch in the bottom right corner of the Question Generator page to create a quiz based on the topic using external knowledge sources.
Flexible Quiz Input:

File Parsing: Upload .txt, .docx, or .pdf files to easily extract content for quiz creation.
Google Docs Integration: Use the open shareable link from Google Docs to generate quizzes directly from your documents.
Enhanced Quiz Visibility:

SidePanel View: Enjoy an organized and enhanced view of your generated quizzes right in the SidePanel.
Editable Forms:

PDF Forms: Generate editable PDF forms based on your quizzes.
Google Forms: Create Google Forms for your quizzes, perfect for easy distribution and response collection.
How to contribute
This is the second year of the project. While some may have their own ideas on how to contribute, for the newcomers to the repository, you may follow the following steps:

First get to know the organization and the project by visiting the Official Website

Visit the Discord Channel for interacting with the community!