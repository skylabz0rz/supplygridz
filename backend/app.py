from flask import Flask, jsonify, Blueprint
from flask_sqlalchemy import SQLAlchemy

from flask_cors import CORS
from jose import jwt
from flask import request, g
import urllib.request
import json

app = Flask(__name__)
CORS(app)

AUTH0_DOMAIN = "dev-tzh46biettai7rin.us.auth0.com"
API_AUDIENCE = "https://supplygridz.com/api"
ALGORITHMS = ["RS256"]

from functools import wraps
from jose.exceptions import JWTError

def get_token_auth_header():
    auth = request.headers.get("Authorization", None)
    if not auth:
        raise Exception("Authorization header is missing")

    parts = auth.split()

    if parts[0].lower() != "bearer":
        raise Exception("Authorization header must start with Bearer")
    elif len(parts) == 1:
        raise Exception("Token not found")
    elif len(parts) > 2:
        raise Exception("Authorization header must be Bearer token")

    return parts[1]

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_auth_header()
        jsonurl = urllib.request.urlopen(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")
        jwks = json.loads(jsonurl.read())

        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }

        if not rsa_key:
            raise Exception("Unable to find appropriate key")

        try:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=ALGORITHMS,
                audience=API_AUDIENCE,
                issuer=f"https://{AUTH0_DOMAIN}/"
            )
        except JWTError as e:
            raise Exception("Token is invalid: " + str(e))

        g.current_user = payload
        return f(*args, **kwargs)

    return decorated


app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:adminpass@db:5432/supplygridz'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
api = Blueprint('api', __name__, url_prefix='/api')

class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)

class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default="available")
    owner_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "status": self.status,
            "owner_id": self.owner_id
        }

@api.route("/")
def home():
    return jsonify({"message": "SupplyGridz backend is running!"})

@api.route("/players")
def players():
    return jsonify([{"id": p.id, "name": p.name} for p in Player.query.all()])

@api.route("/vehicles")
@requires_auth
def vehicles():
    return jsonify([v.to_dict() for v in Vehicle.query.all()])


app.register_blueprint(api)

with app.app_context():
    if not Player.query.first():
        p1 = Player(name="Alice")
        p2 = Player(name="Bob")
        db.session.add_all([p1, p2])
        db.session.commit()
        v1 = Vehicle(type="Semi", owner_id=p1.id)
        v2 = Vehicle(type="Cargo Plane", owner_id=p2.id)
        db.session.add_all([v1, v2])
        db.session.commit()

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')

