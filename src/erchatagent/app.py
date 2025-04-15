import os
import time
import psutil
import asyncio
from pathlib import Path
from document_retriever import DocumentRetriever
from openai_agent import OpenAIAgent


class AssistantApp:
    """Manages the chatbot application."""
    def __init__(self, pdf_path, api_key):
        self.retriever = DocumentRetriever(pdf_path)
        self.agent = OpenAIAgent(api_key, self.retriever)
    
    async def run(self):
        print("Assistant: Hello! How can I assist you today?")
        while True:
            user_input = input("You: ")
            if user_input.lower() in ["exit", "quit"]:
                break
            process = psutil.Process(os.getpid())
            mem_before = process.memory_info().rss / (1024 * 1024)
            start_time = time.time()
            
            response_text = self.agent.generate_response(user_input)
            
            mem_after = process.memory_info().rss / (1024 * 1024)
            end_time = time.time()
            elapsed_time = end_time - start_time
            mem_used = mem_after - mem_before
            
            if not response_text.strip():
                print("Assistant: (No response received)")
            print(f"Execution Time: {elapsed_time:.2f} seconds")
            print(f"Memory Used: {mem_used:.2f} MB")


if __name__ == "__main__":
    api_key = os.environ.get("OPENAI_API_KEY")
    ROOT_DIR = Path(__file__).resolve().parent.parent.parent
    pdf_path = ROOT_DIR / "data" / "ERDataset.pdf"
    app = AssistantApp(pdf_path, api_key)
    asyncio.run(app.run())
