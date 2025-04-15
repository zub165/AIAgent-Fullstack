# Emergency Room Chat Agent

A medical emergency guidance system that provides structured, patient-focused information based on validated medical guidelines from sources like Mayo Clinic and CDC.

## Features

- **Structured Assessment**: Follows a clinical assessment pattern (SOCRATES) to gather relevant patient information
- **High-Risk-First Diagnosis**: Lists potential diagnoses with most critical conditions first
- **Evidence-Based Recommendations**: Provides numbered treatment recommendations based on medical guidelines
- **Emergency Referral**: Clear guidance on when to seek emergency care

## Data Sources

The system includes several data files:
- `ERDataset.pdf`: Structured emergency scenarios and guidelines
- `emergency_guidelines.csv`: Tabular data for emergency conditions
- `symptoms.json`: JSON mapping of symptoms to potential causes

## Installation

1. Clone this repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set your OpenAI API key as an environment variable:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

## Usage

Run the application:
```bash
python src/erchatagent/app.py
```

Then follow the interactive prompts for symptom assessment.

## Project Structure

```
erChatAgent/
├── data/                   # Data files for medical knowledge
│   ├── ERDataset.pdf       # Structured emergency guidance
│   ├── symptoms.json       # Symptom mappings
│   └── emergency_guidelines.csv  # Tabular guidelines
├── src/
│   └── erchatagent/        # Main application code
│       ├── app.py          # Entry point
│       ├── openai_agent.py # OpenAI integration
│       └── retriever.py    # Document retrieval
└── README.md               # This file
```

## Disclaimer

This tool is for informational purposes only and does not replace professional medical advice. In case of emergency, call 911 or your local emergency number immediately.

## Dependencies

*   `openai`: For interacting with the OpenAI API.
*   `PyPDF2`: For extracting text from PDF documents.
*   `sentence-transformers`: For generating sentence embeddings.
*   `faiss`: For efficient similarity search.
*   `numpy`: For numerical operations.
*   `psutil`: For process and system monitoring.

## Testing

To run the unit tests, use the following command:

```bash
poetry run pytest tests
```


