from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

class DocumentRetriever:
    """Facade class for handling document retrieval."""
    def __init__(self, pdf_path, model_name="all-MiniLM-L6-v2"):
        self.pdf_path = pdf_path
        self.embedding_model = SentenceTransformer(model_name)
        self.index, self.chunks = self._build_index()
    
    def _extract_text(self):
        reader = PdfReader(self.pdf_path)
        return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    
    def _chunk_text(self, text, chunk_size=500):
        sentences = text.split("Question")
        chunks, current_chunk = [], ""
        for sentence in sentences:
            if len(current_chunk) + len(sentence) < chunk_size:
                current_chunk += sentence + ". "
            else:
                chunks.append(current_chunk)
                current_chunk = sentence + ". "
        if current_chunk:
            chunks.append(current_chunk)
        return chunks
    
    def _build_index(self):
        text = self._extract_text()
        chunks = self._chunk_text(text)
        embeddings = self.embedding_model.encode(chunks)
        index = faiss.IndexFlatL2(embeddings.shape[1])
        index.add(np.array(embeddings, dtype=np.float32))
        return index, chunks
    
    def search(self, query, top_k=3):
        query_embedding = self.embedding_model.encode([query])
        distances, indices = self.index.search(np.array(query_embedding, dtype=np.float32), top_k)
        return [self.chunks[i] for i in indices[0] if i < len(self.chunks)]
