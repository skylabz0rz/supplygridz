from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    # In production, you'd check credentials from DB
    if data.get("username") and data.get("password"):
        return jsonify({"message": "Login successful", "token": "fake-jwt-token"}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    # In production, you'd store this in DB
    return jsonify({"message": f"Registered user {data.get('username')}"}), 201

@app.route("/")
def root():
    return jsonify({"message": "Auth service online"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")

