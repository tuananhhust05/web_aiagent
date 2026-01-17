"""
Vectorization service using sentence-transformers with all-distilroberta-v1 model
"""
from typing import List, Optional
import numpy as np
import logging
import traceback

logger = logging.getLogger(__name__)

# Global model instance (lazy loading)
_model = None

def get_vectorizer_model():
    """Get or initialize the sentence transformer model"""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence transformer model: all-distilroberta-v1")
            _model = SentenceTransformer('sentence-transformers/all-distilroberta-v1')
            logger.info("Model loaded successfully")
        except ImportError:
            logger.error("sentence-transformers not installed. Install with: pip install sentence-transformers")
            raise
        except Exception as e:
            logger.error(f"Failed to load vectorization model: {e}")
            raise
    return _model

def vectorize_text(text: str) -> List[float]:
    """
    Vectorize a single text string using all-distilroberta-v1 model
    
    Args:
        text: Input text to vectorize
        
    Returns:
        List of floats representing the embedding vector
    """
    try:
        model = get_vectorizer_model()
        embedding = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Error vectorizing text: {e}")
        raise

def vectorize_texts(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    """
    Vectorize multiple text strings in batch
    
    Args:
        texts: List of input texts to vectorize
        batch_size: Batch size for processing
        
    Returns:
        List of embedding vectors (each is a list of floats)
    """
    try:
        logger.info(f"🔢 [VECTOR] Starting vectorization of {len(texts)} texts (batch_size={batch_size})...")
        model = get_vectorizer_model()
        logger.info(f"✅ [VECTOR] Model loaded, encoding texts...")
        
        embeddings = model.encode(
            texts, 
            batch_size=batch_size,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=True  # Show progress for long operations
        )
        
        logger.info(f"✅ [VECTOR] Vectorized {len(embeddings)} texts (dimension: {embeddings[0].shape[0] if len(embeddings) > 0 else 0})")
        return [emb.tolist() for emb in embeddings]
    except Exception as e:
        logger.error(f"❌ [VECTOR] Error vectorizing texts: {e}")
        traceback.print_exc()
        raise

def get_vector_dimension() -> int:
    """
    Get the dimension of vectors produced by the model
    
    Returns:
        Integer dimension of the embedding vector
    """
    try:
        model = get_vectorizer_model()
        # Create a dummy embedding to get dimension
        test_embedding = model.encode("test", convert_to_numpy=True)
        return int(test_embedding.shape[0])
    except Exception as e:
        logger.error(f"Error getting vector dimension: {e}")
        # Default dimension for all-distilroberta-v1 is 768
        return 768
