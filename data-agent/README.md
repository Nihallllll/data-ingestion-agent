Inpact - AI-Powered Creator Collaboration & Sponsorship Matchmaking
Inpact is an open-source AI-powered platform designed to connect content creators, brands, and agencies through data-driven insights. By leveraging Generative AI (GenAI), audience analytics, and engagement metrics, Inpact ensures highly relevant sponsorship opportunities for creators while maximizing ROI for brands investing in influencer marketing.

Features
AI-Driven Sponsorship Matchmaking
Automatically connects creators with brands based on audience demographics, engagement rates, and content style.
AI-Powered Creator Collaboration Hub
Facilitates partnerships between creators with complementary audiences and content niches.
AI-Based Pricing & Deal Optimization
Provides fair sponsorship pricing recommendations based on engagement, market trends, and historical data.
AI-Powered Negotiation & Contract Assistant
Assists in structuring deals, generating contracts, and optimizing terms using AI insights.
Performance Analytics & ROI Tracking
Enables brands and creators to track sponsorship performance, audience engagement, and campaign success.
Tech Stack
Frontend: ReactJS
Backend: FastAPI
Database: Supabase
AI Integration: GenAI for audience analysis and sponsorship recommendations
Workflow
1. User Registration & Profile Setup
Creators, brands, and agencies sign up and set up their profiles.
AI gathers audience insights and engagement data.
2. AI-Powered Sponsorship Matchmaking
The platform suggests brands and sponsorship deals based on audience metrics.
Creators can apply for sponsorships or receive brand invitations.
3. Collaboration Hub
Creators can find and connect with others for joint campaigns.
AI recommends potential collaborations based on niche and audience overlap.
4. AI-Based Pricing & Contract Optimization
AI provides fair pricing recommendations for sponsorships.
Auto-generates contract templates with optimized terms.
5. Campaign Execution & Tracking
Creators execute sponsorship campaigns.
Brands track campaign performance through engagement and ROI metrics.
6. Performance Analysis & Continuous Optimization
AI analyzes campaign success and suggests improvements for future deals.
Brands and creators receive insights for optimizing future sponsorships.
Getting Started
Prerequisites
Ensure you have the following installed:

Node.js & npm
Python & FastAPI
Supabase account
Installation
1. Clone the repository
git clone https://github.com/AOSSIE-Org/InPact.git
cd inpact
2. Frontend Setup
Navigate to the frontend directory:
cd frontend
Install dependencies:
npm install
Create a .env file using .env-example file:

Get your Supabase credentials:

Go to Supabase
Log in and create a new project (or use existing)
Go to Project Settings -> API
Copy the "Project URL" and paste it as VITE_SUPABASE_URL
Copy the "anon public" key and paste it as VITE_SUPABASE_ANON_KEY
3. Backend Setup
Navigate to the backend directory:
cd ../backend
Install dependencies:
pip install -r requirements.txt
Navigate to the app directory:
cd app
Create a .env file using .env-example as a reference.

Obtain Supabase credentials:

Go to Supabase

Log in and create a new project

Click on the project and remember the project password

Go to the Connect section at the top

Select SQLAlchemy and copy the connection string:

user=postgres
password=[YOUR-PASSWORD]
host=db.wveftanaurduixkyijhf.supabase.co
port=5432
dbname=postgres
--OR--

[The above works in ipv6 networks, if you are in ipv4 network or it cause errors, use the below connection string which could be found in Session Pooler connection]

 user=postgres.<project>
 password=[YOUR-PASSWORD]
 host=aws-<location>.pooler.supabase.com
 port=5432
 dbname=postgres
Get the Groq API key:

Visit Groq Console
Create an API key and paste it into the .env file
4. Start Development Servers
Start the frontend server (from the frontend directory):
npm run dev
Start the backend server (from the backend/app directory):
uvicorn main:app --reload
Data Population
To populate the database with initial data, follow these steps:

Open Supabase Dashboard

Go to Supabase and log in.
Select your created project.
Access the SQL Editor

In the left sidebar, click on SQL Editor.
Run the SQL Script

Open the sql.txt file in your project.
Copy the SQL queries from the file.
Paste the queries into the SQL Editor and click Run.
This will populate the database with the required initial data for the platform. 🚀

Contributing
We welcome contributions from the community! To contribute:

Fork the repository.
Create a new branch for your feature (git checkout -b feature-name).
Commit your changes (git commit -m "Added feature").
Push to your branch (git push origin feature-name).
Open a Pull Request.
Overall Workflow

FRONTEND workflow in detail


BACKEND workflow in detail


Contact
For queries, issues, or feature requests, please raise an issue or reach out on our Discord server.

Happy Coding!