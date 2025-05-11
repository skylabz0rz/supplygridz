from flask import Flask, jsonify, Blueprint
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:X8r9vPq2wLmA@db:5432/supplygridz'
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

