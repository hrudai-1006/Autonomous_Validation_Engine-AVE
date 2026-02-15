from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# Load env vars first
load_dotenv()

from app.database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        try:
            print("Adding extraction_mode column to system_config...")
            conn.execute(text("ALTER TABLE system_config ADD COLUMN extraction_mode VARCHAR DEFAULT 'batch'"))
            conn.commit()
            print("Migration successful: Added extraction_mode column.")
        except Exception as e:
            if "duplicate column" in str(e):
                print("Column already exists. Skipping.")
            else:
                print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
