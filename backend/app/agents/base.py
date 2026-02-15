from datetime import datetime
from sqlalchemy.orm import Session
from ..models import AgentLog

class BaseAgent:
    def __init__(self, name: str, db: Session):
        self.name = name
        self.db = db

    def log(self, message: str, level: str = "INFO"):
        """Log an action to the database for the UI stream."""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {self.name}: {message}")
        log_entry = AgentLog(
            agent_name=self.name,
            message=message,
            level=level,
            timestamp=datetime.utcnow()
        )
        self.db.add(log_entry)
        self.db.commit()
