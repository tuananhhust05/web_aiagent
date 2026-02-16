from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlparse
import json
from pathlib import Path
from app.core.config import settings

# Try to import weaviate, handle gracefully if not installed
try:
    import weaviate
    from weaviate.classes.config import Property, DataType
    WEAVIATE_AVAILABLE = True
except ImportError:
    WEAVIATE_AVAILABLE = False
    print("⚠️ [WARNING] weaviate-client not installed. Weaviate features will be disabled.")
    print("⚠️ [WARNING] Install with: pip install weaviate-client")

class Database:
    client: AsyncIOMotorClient = None
    weaviate_client = None

db = Database()

def load_weaviate_schema():
    """Load Weaviate schema from JSON file. Returns list of class configs (for migration)."""
    backend_root = Path(__file__).parent.parent.parent
    schema_path = backend_root / "weaviate_schema.json"
    try:
        with open(schema_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"⚠️ [WARNING] Schema file not found: {schema_path}")
        return []
    except json.JSONDecodeError as e:
        print(f"⚠️ [WARNING] Invalid JSON in schema file: {e}")
        return []
    # Support both: {"classes": [...]} and legacy {"class": "...", "properties": [...]}
    if "classes" in data:
        return data["classes"]
    if "class" in data:
        return [data]
    return []

def ensure_weaviate_class(client, schema_config):
    """Ensure Weaviate class exists, create if it doesn't"""
    if not schema_config:
        return False
    
    class_name = schema_config.get("class")
    if not class_name:
        print("⚠️ [WARNING] No class name found in schema")
        return False
    
    try:
        # Check if class exists
        if client.collections.exists(class_name):
            print(f"✅ [WEAVIATE] Class '{class_name}' already exists")
            return True
        
        # Create class if it doesn't exist
        print(f"📝 [WEAVIATE] Creating class '{class_name}'...")
        
        # Convert schema properties to Weaviate Property objects
        properties = []
        for prop in schema_config.get("properties", []):
            prop_name = prop.get("name")
            prop_data_type = prop.get("dataType", ["text"])
            prop_description = prop.get("description", "")
            
            # Map dataType to Weaviate DataType enum
            data_type = DataType.TEXT
            if prop_data_type[0] == "int":
                data_type = DataType.INT
            elif prop_data_type[0] == "number":
                data_type = DataType.NUMBER
            elif prop_data_type[0] == "boolean":
                data_type = DataType.BOOL
            elif prop_data_type[0] == "date":
                data_type = DataType.DATE
            
            properties.append(
                Property(
                    name=prop_name,
                    data_type=data_type,
                    description=prop_description
                )
            )
        
        # Create collection
        client.collections.create(
            name=class_name,
            description=schema_config.get("description", ""),
            vectorizer_config=None,  # vectorizer: "none"
            properties=properties
        )
        
        print(f"✅ [WEAVIATE] Class '{class_name}' created successfully")
        return True
        
    except Exception as e:
        print(f"❌ [ERROR] Failed to create Weaviate class '{class_name}': {e}")
        return False

async def init_db():
    # Initialize MongoDB
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    print("Connected to MongoDB")
    
    # Initialize Weaviate (only if available)
    if not WEAVIATE_AVAILABLE:
        print("⚠️ [WARNING] Skipping Weaviate initialization - package not installed")
        return
    
    try:
        parsed_url = urlparse(settings.WEAVIATE_URL)
        host = parsed_url.hostname or "localhost"
        port = parsed_url.port or 8080
        scheme = parsed_url.scheme or "http"
        
        auth_config = None
        if settings.WEAVIATE_API_KEY:
            auth_config = weaviate.auth.AuthApiKey(api_key=settings.WEAVIATE_API_KEY)
        
        # Connect to Weaviate
        if auth_config:
            db.weaviate_client = weaviate.connect_to_custom(
                http_host=host,
                http_port=port,
                http_secure=(scheme == "https"),
                grpc_host=host,
                grpc_port=50051,
                grpc_secure=(scheme == "https"),
                auth_credentials=auth_config
            )
        else:
            db.weaviate_client = weaviate.connect_to_custom(
                http_host=host,
                http_port=port,
                http_secure=(scheme == "https"),
                grpc_host=host,
                grpc_port=50051,
                grpc_secure=(scheme == "https")
            )
        print(f"Connected to Weaviate at {settings.WEAVIATE_URL}")
        
        # Migration: ensure all Weaviate classes exist, create if missing
        class_configs = load_weaviate_schema()
        for schema_config in class_configs:
            ensure_weaviate_class(db.weaviate_client, schema_config)
        
    except Exception as e:
        print(f"⚠️ [WARNING] Failed to connect to Weaviate: {e}")
        print("⚠️ [WARNING] App will continue without Weaviate")

async def close_db():
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")
    
    if db.weaviate_client and WEAVIATE_AVAILABLE:
        try:
            db.weaviate_client.close()
            print("Disconnected from Weaviate")
        except Exception as e:
            print(f"⚠️ [WARNING] Error closing Weaviate connection: {e}")

def get_database():
    if db.client is None:
        raise RuntimeError("Database client not initialized. Call init_db() first.")
    return db.client[settings.MONGODB_DATABASE]

def get_weaviate():
    return db.weaviate_client 