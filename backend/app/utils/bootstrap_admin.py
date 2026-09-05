import sys
import os
from sqlalchemy import select
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.admin_user import AdminUser
from app.utils.security import get_password_hash


def bootstrap_admin():
    email = settings.INITIAL_ADMIN_EMAIL or "admin@sentinel.local"
    password = settings.INITIAL_ADMIN_PASSWORD or os.getenv("INITIAL_ADMIN_PASSWORD")

    db = SessionLocal()
    try:
        existing = db.scalar(select(AdminUser).where(AdminUser.email == email.strip().lower()))
        if existing:
            print(f"Admin user already exists: {email}")
            return

        if not password:
            sys.stderr.write(
                "Error: INITIAL_ADMIN_PASSWORD environment variable is required to bootstrap initial admin user.\n"
            )
            sys.exit(1)

        admin = AdminUser(
            email=email.strip().lower(),
            password_hash=get_password_hash(password),
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Initial admin user created successfully: {email}")
    except Exception as e:
        db.rollback()
        sys.stderr.write(f"Error bootstrapping admin user: {str(e)}\n")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap_admin()

