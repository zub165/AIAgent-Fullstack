import os
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from openai import OpenAI
import time

# Initialize Flask app
app = Flask(__name__)
# Enable CORS with specific settings
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": ["Content-Type", "X-Session-ID"]}})

class OpenAIAgentAPI:
    """Handles interactions with OpenAI's GPT model."""
    def __init__(self, api_key):
        self.client = OpenAI(api_key=api_key)
        self.message_history = {}  # Store conversation history by session ID
        self.system_prompt = """
You are an AI medical assistant trained to help assess symptoms and provide guidance based on Mayo Clinic guidelines.

For symptoms like chest pain, follow this stepwise approach:

1. Ask the following questions one by one, waiting for the patient's answer after each:
   1. Where exactly is the pain? (Location)
   2. Does the pain spread anywhere else, like your arm, jaw, or back? (Radiation)
   3. How would you describe the pain? Is it sharp, dull, pressure-like, or squeezing? (Character)
   4. When did it start? Was it sudden or gradual? (Onset)
   5. How long has it been hurting? (Duration)
   6. (Skip for now)
   7. What makes the pain better or worse? (Aggravating/Alleviating Factors)
   8. Have you experienced this type of pain before? (Previous Episodes)

2. After collecting all answers, your response should be structured as follows:
   a. **History Recap:** Summarize the patient's answers to all assessment questions in a clear, concise paragraph.
   b. **Differential Diagnosis:** List at least 5–7 possible diagnoses, ordered from highest risk (life-threatening) to lowest risk, and clearly label high-risk ones.
   c. **Treatment/Recommendations:** Provide a numbered list of stepwise recommendations for the patient.
   d. **Disclaimer & Emergency Referral:** End with a clear disclaimer and advice to call 911 or seek emergency care if any red flag symptoms are present.

General rules:
- Ask one question at a time and wait for the answer before proceeding.
- Use clear, patient-friendly language.
- If the patient describes severe symptoms or red flags at any point, skip to emergency advice immediately.
- Always include a disclaimer that this is not a substitute for professional medical advice.
"""
    
    def get_or_create_history(self, session_id):
        """Get existing conversation history or create a new one."""
        if session_id not in self.message_history:
            self.message_history[session_id] = [
                {"role": "system", "content": self.system_prompt}
            ]
        return self.message_history[session_id]
    
    def generate_response(self, session_id, prompt):
        """Generate a response based on the prompt and conversation history."""
        history = self.get_or_create_history(session_id)
        history.append({"role": "user", "content": prompt})
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=history,
                max_tokens=500,
                temperature=0.2
            )
            
            if response.choices and response.choices[0].message:
                response_text = response.choices[0].message.content
                history.append({"role": "assistant", "content": response_text})
                return response_text
            else:
                return "Sorry, I couldn't generate a response."
        except Exception as e:
            print(f"Error generating response: {e}")
            return f"Sorry, an error occurred: {str(e)}"

# Initialize the agent
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    print("WARNING: OPENAI_API_KEY environment variable not set")
agent = OpenAIAgentAPI(api_key)

# Add a basic route to check if the API is working
@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "API is running", "endpoints": ["/api/chat"]})

# Add /chat endpoint to redirect to /api/chat for compatibility
@app.route('/chat', methods=['GET', 'POST', 'OPTIONS'])
def chat_redirect():
    """Redirect /chat to /api/chat for compatibility"""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,X-Session-ID')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST')
        return response
    
    return jsonify({"status": "Please use /api/chat endpoint instead", "redirect": "/api/chat"})

@app.route('/api/chat', methods=['GET', 'POST', 'OPTIONS', 'DELETE'])
def chat():
    """Handle chat requests."""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,X-Session-ID')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,DELETE')
        return response
    
    # Handle GET request for testing
    if request.method == 'GET':
        return jsonify({
            "status": "API is working",
            "usage": "Send POST requests to this endpoint with a message field"
        })
    
    # Handle DELETE request for clearing chat history
    if request.method == 'DELETE':
        try:
            session_id = request.headers.get('X-Session-ID', 'default')
            if hasattr(agent, 'message_history') and session_id in agent.message_history:
                # Keep only the system message
                system_message = agent.message_history[session_id][0]
                agent.message_history[session_id] = [system_message]
            return jsonify({"status": "Chat history cleared", "session_id": session_id})
        except Exception as e:
            print(f"Error clearing chat history: {str(e)}")
            return jsonify({"error": str(e)}), 500
        
    # Process POST request
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({"error": "No message provided"}), 400
        
        message = data['message']
        print(f"Received message: {message}")
        session_id = request.headers.get('X-Session-ID', 'default')
        
        response_text = agent.generate_response(session_id, message)
        
        # Fix numbered list formatting if needed - replace patterns like "1. 1." with just "1."
        response_text = response_text.replace(r'\b(\d+)\.\s+\1\.', r'\1.')
        
        response = jsonify({
            "response": response_text,
            "session_id": session_id
        })
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Error handler for 404 errors
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "error": "Endpoint not found",
        "message": "The requested URL was not found on the server.",
        "available_endpoints": ["/", "/api/chat", "/chat"]
    }), 404

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0') 