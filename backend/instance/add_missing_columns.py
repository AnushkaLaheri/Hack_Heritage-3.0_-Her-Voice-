import sqlite3
import os

# Database path (same folder as script)
db_path = os.path.join(os.path.dirname(__file__), "app.db")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check existing columns
cursor.execute("PRAGMA table_info(user);")
existing_columns = [col[1] for col in cursor.fetchall()]

# Add 'otp' column if it doesn't exist
if 'otp' not in existing_columns:
    cursor.execute("ALTER TABLE user ADD COLUMN otp TEXT;")
    print("Column 'otp' added.")

# Add 'otp_created_at' column if it doesn't exist
if 'otp_created_at' not in existing_columns:
    cursor.execute("ALTER TABLE user ADD COLUMN otp_created_at DATETIME;")
    print("Column 'otp_created_at' added.")

conn.commit()
conn.close()
print("All missing columns have been added successfully!")
