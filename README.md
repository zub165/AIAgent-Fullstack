# AIAgent - Emergency Medical Assistant

A full-stack application that provides structured, patient-focused emergency medical information based on validated guidelines from sources like Mayo Clinic and CDC.

## Overview

This project combines:
- A **Frontend** web interface for user interaction
- A **Backend** medical knowledge system powered by AI

## Features

- **Structured Assessment**: Follows clinical assessment patterns to gather relevant patient information
- **High-Risk-First Diagnosis**: Lists potential diagnoses with most critical conditions first
- **Evidence-Based Recommendations**: Provides numbered treatment recommendations based on medical guidelines
- **Emergency Referral**: Clear guidance on when to seek emergency care
- **User-Friendly Interface**: Clean web interface for easy interaction

## Project Structure

```
AIAgent-Fullstack/
├── frontend/               # Web interface
│   ├── index.html          # Main HTML page
│   ├── styles.css          # CSS styling
│   └── script.js           # Frontend JavaScript
├── backend/                # Python backend
│   ├── data/               # Medical knowledge datasets
│   │   ├── ERDataset.pdf   # Structured emergency guidance
│   │   ├── symptoms.json   # Symptom mappings
│   │   └── emergency_guidelines.csv  # Tabular guidelines
│   ├── src/                # Source code
│   │   └── erchatagent/    # Python package
│   │       ├── app.py      # Entry point
│   │       ├── openai_agent.py # AI integration
│   │       └── retriever.py # Document retrieval
│   └── requirements.txt    # Python dependencies
└── README.md               # This file
```

## Installation

### Backend Setup

1. Set up the Python environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

### Frontend Setup

Simply open the frontend/index.html file in a web browser.

## Usage

1. Start the backend:
   ```bash
   cd backend
   source venv/bin/activate
   python src/erchatagent/app.py
   ```

2. Open the frontend in your browser:
   ```bash
   open frontend/index.html
   ```

3. Follow the interactive prompts to assess symptoms and get medical guidance.

## Disclaimer

This tool is for informational purposes only and does not replace professional medical advice. In case of emergency, call 911 or your local emergency number immediately.

## Dependencies

### Backend
- `openai`: For interacting with the OpenAI API
- `PyPDF2`: For extracting text from PDF documents
- `sentence-transformers`: For generating sentence embeddings
- `numpy`: For numerical operations

### Frontend
- HTML/CSS/JavaScript: For user interface
