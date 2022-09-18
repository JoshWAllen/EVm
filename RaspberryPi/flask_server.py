from flask import Flask, request, redirect, flash, url_for
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

ping = 0
kwh  = 0

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/interrupt')
def interrupt():
    global ping
    ping = 1
    return "a string"

@app.route('/start')
def start():    
    global ping
    return json.dumps({"ping":ping})

@app.route('/end', methods=["POST"])
def end():
    global kwh
    global ping
    ping = 0
    data = request.get_json()
    kwh = data["kwh"]
    return "a string"

@app.route('/returns')
def returns():
    global kwh
    return json.dumps({"kwh":kwh})

     
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
