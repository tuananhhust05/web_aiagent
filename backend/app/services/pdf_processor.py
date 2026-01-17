"""
PDF Processing Service
Handles PDF reading, text extraction, chunking, and token estimation
"""
import re
from typing import List, Tuple
import logging
from transformers import AutoTokenizer

logger = logging.getLogger(__name__)

# Global tokenizer instance (lazy loading)
_tokenizer = None

def get_tokenizer():
    """Get or initialize the tokenizer for all-distilroberta-v1"""
    global _tokenizer
    if _tokenizer is None:
        try:
            # all-distilroberta-v1 uses distilroberta-base tokenizer
            _tokenizer = AutoTokenizer.from_pretrained('distilroberta-base')
            logger.info("Tokenizer loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load tokenizer: {e}")
            raise
    return _tokenizer

def estimate_tokens(text: str) -> int:
    """
    Estimate token count for text using distilroberta tokenizer
    
    Args:
        text: Input text
        
    Returns:
        Estimated token count
    """
    try:
        tokenizer = get_tokenizer()
        # Tokenize and count
        tokens = tokenizer.encode(text, add_special_tokens=False)
        return len(tokens)
    except Exception as e:
        logger.warning(f"Error estimating tokens, using fallback: {e}")
        # Fallback: ~4 characters per token (rough estimate)
        return len(text) // 4

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from PDF file
    
    Args:
        pdf_path: Path to PDF file
        
    Returns:
        Extracted text content
    """
    try:
        from pypdf import PdfReader
        
        reader = PdfReader(pdf_path)
        text_parts = []
        
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        full_text = "\n\n".join(text_parts)
        logger.info(f"Extracted {len(full_text)} characters from PDF")
        return full_text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise

def split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences
    
    Args:
        text: Input text
        
    Returns:
        List of sentences
    """
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Split by sentence endings
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    # Filter out empty sentences
    sentences = [s.strip() for s in sentences if s.strip()]
    
    return sentences

def create_chunks(
    sentences: List[str], 
    max_tokens: int = 512
) -> List[Tuple[str, int]]:
    """
    Create chunks from sentences, ensuring each chunk doesn't exceed max_tokens
    
    Args:
        sentences: List of sentences
        max_tokens: Maximum tokens per chunk (default 512 for all-distilroberta-v1)
        
    Returns:
        List of tuples (chunk_text, chunk_index)
    """
    chunks = []
    current_chunk = []
    current_tokens = 0
    chunk_index = 0
    
    for sentence in sentences:
        sentence_tokens = estimate_tokens(sentence)
        
        # If single sentence exceeds max_tokens, split it further
        if sentence_tokens > max_tokens:
            # If we have accumulated content, save it first
            if current_chunk:
                chunk_text = " ".join(current_chunk)
                chunks.append((chunk_text, chunk_index))
                chunk_index += 1
                current_chunk = []
                current_tokens = 0
            
            # Split long sentence by words
            words = sentence.split()
            word_chunk = []
            word_tokens = 0
            
            for word in words:
                word_token_count = estimate_tokens(word)
                
                if word_tokens + word_token_count > max_tokens and word_chunk:
                    # Save current word chunk
                    chunk_text = " ".join(word_chunk)
                    chunks.append((chunk_text, chunk_index))
                    chunk_index += 1
                    word_chunk = [word]
                    word_tokens = word_token_count
                else:
                    word_chunk.append(word)
                    word_tokens += word_token_count
            
            # Add remaining words
            if word_chunk:
                current_chunk = word_chunk
                current_tokens = word_tokens
        else:
            # Check if adding this sentence would exceed limit
            if current_tokens + sentence_tokens > max_tokens and current_chunk:
                # Save current chunk
                chunk_text = " ".join(current_chunk)
                chunks.append((chunk_text, chunk_index))
                chunk_index += 1
                current_chunk = [sentence]
                current_tokens = sentence_tokens
            else:
                # Add to current chunk
                current_chunk.append(sentence)
                current_tokens += sentence_tokens
    
    # Add remaining chunk
    if current_chunk:
        chunk_text = " ".join(current_chunk)
        chunks.append((chunk_text, chunk_index))
    
    logger.info(f"Created {len(chunks)} chunks from {len(sentences)} sentences")
    return chunks

def process_pdf_to_chunks(pdf_path: str, max_tokens: int = 512) -> List[Tuple[str, int]]:
    """
    Process PDF file: extract text, split into sentences, create chunks
    
    Args:
        pdf_path: Path to PDF file
        max_tokens: Maximum tokens per chunk
        
    Returns:
        List of tuples (chunk_text, chunk_index)
    """
    logger.info(f"📄 [PDF] Processing PDF: {pdf_path}")
    
    # Extract text
    logger.info(f"📖 [PDF] Extracting text from PDF...")
    text = extract_text_from_pdf(pdf_path)
    logger.info(f"✅ [PDF] Extracted {len(text)} characters from PDF")
    
    # Split into sentences
    logger.info(f"✂️ [PDF] Splitting text into sentences...")
    sentences = split_into_sentences(text)
    logger.info(f"✅ [PDF] Split into {len(sentences)} sentences")
    
    # Create chunks
    logger.info(f"📦 [PDF] Creating chunks (max_tokens={max_tokens})...")
    chunks = create_chunks(sentences, max_tokens)
    logger.info(f"✅ [PDF] Created {len(chunks)} chunks")
    
    return chunks
