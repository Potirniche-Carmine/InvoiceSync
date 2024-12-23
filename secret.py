import bcrypt

# Define your password
password = b"dA29.BUu?8(E3Gtn8&7|"

# Generate a salt and hash the password
hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())
print("Password Hash:", hashed_password)