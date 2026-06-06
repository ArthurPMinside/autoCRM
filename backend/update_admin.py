"""Update admin credentials. Run: cd /opt/autoCRM/backend && python update_admin.py"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

NEW_EMAIL = "artur@crmio.ru"
NEW_PASSWORD = "Xk9#mP2$vL7@qR4"

def update_admin():
    db = SessionLocal()
    try:
        # Find existing admin
        admin = db.query(User).filter(User.is_admin == True).first()
        if admin:
            admin.email = NEW_EMAIL
            admin.hashed_password = get_password_hash(NEW_PASSWORD)
            db.commit()
            print(f"✅ Admin updated: {NEW_EMAIL}")
        else:
            # Create new admin if none exists
            admin = User(
                email=NEW_EMAIL,
                hashed_password=get_password_hash(NEW_PASSWORD),
                name="Администратор",
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print(f"✅ Admin created: {NEW_EMAIL}")
        print(f"🔑 Password: {NEW_PASSWORD}")
    finally:
        db.close()

if __name__ == "__main__":
    update_admin()
