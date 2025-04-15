import os
from openai import OpenAI
import time

class SimpleAssistantApp:
    """Manages a simplified chatbot application."""
    def __init__(self, api_key):
        self.client = OpenAI(api_key=api_key)
        self.message_history = [{"role": "system", "content": self.get_instructions()}]
    
    def get_instructions(self):
        return """
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
    
    def generate_response(self, prompt):
        self.message_history.append({"role": "user", "content": prompt})
        
        start_time = time.time()
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",  
            messages=self.message_history,
            max_tokens=500,
            temperature=0.2,
            stream=True  
        )
        
        response_text = ""
        try:
            for chunk in response:
                if chunk.choices:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        text = delta.content
                        response_text += text
                        print(text, end="", flush=True)  # Ensuring immediate output to console
        except Exception as e:
            print(f"Error while processing response: {e}")
        
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f"\nResponse generated in {elapsed_time:.2f} seconds")
        
        self.message_history.append({"role": "assistant", "content": response_text})
        return response_text
    
    def run(self):
        print("Assistant: Hello! How can I assist you today?")
        while True:
            user_input = input("You: ")
            if user_input.lower() in ["exit", "quit"]:
                break
            
            self.generate_response(user_input)


if __name__ == "__main__":
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        api_key = input("Please enter your OpenAI API key: ")
        os.environ["OPENAI_API_KEY"] = api_key
    
    app = SimpleAssistantApp(api_key)
    app.run()
