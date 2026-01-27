PictoPy
PictoPy is an advanced desktop gallery application that combines the power of Tauri, React, and Rust for the frontend with a Python backend for sophisticated image analysis and management.

Want to Contribute? 😄
   

First, join the Discord Server (Go to Projects->PictoPy) to chat with everyone.
For detailed setup instructions, coding guidelines, and the contribution process, please check out our CONTRIBUTING.md file.
Architecture
Frontend
Tauri: Enables building the desktop application
React: Used for creating the user interface
Rust: Powers the backend, which the frontend communicates with through Tauri's API
Backend (Python)
FastAPI: Serves as the API framework
SQLite: Database for storing metadata and embeddings
YOLO: Used for object detection
FaceNet: Generates face embeddings
ONNX Runtime: Runs the models efficiently
DBSCAN: Performs clustering for face embeddings
Backend (Rust via Tauri)
Handles file system operations and provides a secure bridge between the frontend and local system.

Features
Smart tagging of photos based on detected objects, faces, and their recognition
Traditional gallery features of album management
Advanced image analysis with object detection and facial recognition
Privacy-focused design with offline functionality
Efficient data handling and parallel processing
Smart search and retrieval
Cross-platform compatibility
Technical Stack
Component	Technology
Frontend	React
Desktop Framework	Tauri
Rust Backend	Rust
Python Backend	Python
Database	SQLite
Image Processing	OpenCV, ONNX Runtime
Object Detection	YOLOv11
Face Recognition	FaceNet
API Framework	FastAPI
State Management	Redux Toolkit
Styling	Tailwind CSS
Routing	React Router
UI Components	ShadCN
Build Tool	Vite
Type Checking	TypeScript
Our Code of Conduct: CODE_OF_CONDUCT.md








PegGuard
One-line Summary: An algorithmic stablecoin with built-in circuit breakers to prevent death spirals.
Problem It Solves: Algorithmic stablecoins often fail during volatility, causing total value loss (e.g., Iron Finance's collapse), which erodes user confidence and limits DeFi's use for real-world finance.
How It Works: The stablecoin maintains a peg through mint/burn mechanics tied to a governance token. During extreme volatility, circuit breakers pause minting and enforce gradual redemptions based on oracle data. Users stake collateral to earn yields, with automated rebalancing.
Why Existing Solutions Are Not Enough: DAI is overcollateralized but inefficient; failed projects like Basis lacked safeguards. This adds volatility controls missing in most designs.
Who Would Use This: Yield farmers, DAOs for treasury management, emerging markets for low-volatility assets.
Why This Is a Good Open-Source Project: Allows community testing of peg algorithms, integrates with other DeFi tools, and shares lessons from past failures to build resilient standards. 