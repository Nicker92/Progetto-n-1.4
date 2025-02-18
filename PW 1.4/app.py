from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import os

# Inizializzazione dell'app Flask
app = Flask(__name__, static_folder="static")
CORS(app)

# Array per memorizzare le prenotazioni in memoria
reservations = []

# Serve la homepage
@app.route('/')
def home():
    return send_from_directory(app.static_folder, "index.html")

# Serve i file statici
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

# Endpoint per creare una prenotazione
@app.route('/booking', methods=['POST'])
def create_booking():
    try:
        data = request.get_json()  # Ricezione dati JSON dal client

        if not data:
            return jsonify({'message': 'Errore: Nessun dato ricevuto!'}), 400

        # Campi obbligatori per la prenotazione
        required_fields = ['name', 'email', 'service', 'date', 'time']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'Errore: Campo mancante ({field})!'}), 400

        booking_date = datetime.strptime(data['date'], "%Y-%m-%d").date()
        today = datetime.today().date()
        
        if booking_date < today:
            return jsonify({'message': 'Errore: Non puoi prenotare per una data passata!'}), 400

        new_reservation = {
            'id': len(reservations) + 1,
            'name': data['name'],
            'email': data['email'],
            'service': data['service'],
            'date': data['date'],
            'time': data['time'],
        }
        reservations.append(new_reservation)  # Aggiunta alla lista
        return jsonify({'message': 'Prenotazione creata con successo!', 'reservation': new_reservation}), 201

    except Exception as e:
        return jsonify({'message': f'Errore nel parsing JSON: {str(e)}'}), 400

# Ottiene tutte le prenotazioni di un utente
@app.route('/reservations', methods=['GET'])
def get_reservations():
    email = request.args.get('email')
    
    if not email:
        return jsonify({'message': 'Errore: Email richiesta'}), 400

    user_reservations = [res for res in reservations if res['email'] == email]
    return jsonify(user_reservations), 200

# Aggiorna una prenotazione
@app.route('/reservations/<int:id>', methods=['PUT'])
def update_reservation(id):
    try:
        data = request.get_json()  

        for res in reservations:
            if res['id'] == id:
                new_date = datetime.strptime(data.get('date', res['date']), "%Y-%m-%d").date()
                today = datetime.today().date()

                if new_date < today:
                    return jsonify({'message': 'Errore: Non puoi modificare la prenotazione con una data passata!'}), 400

                available_services = ["Massaggio", "Accesso alla Spa", "Trattamento Viso"]
                if data.get('service') and data['service'] not in available_services:
                    return jsonify({'message': 'Errore: Servizio non valido!'}), 400

                res['service'] = data.get('service', res['service'])
                res['date'] = data.get('date', res['date'])
                res['time'] = data.get('time', res['time'])
                return jsonify({'message': 'Prenotazione modificata con successo!', 'reservation': res}), 200

        return jsonify({'message': 'Errore: Prenotazione non trovata!'}), 404

    except Exception as e:
        return jsonify({'message': f'Errore nella modifica: {str(e)}'}), 400

# Elimina una prenotazione
@app.route('/reservations/<int:id>', methods=['DELETE'])
def delete_reservation(id):
    global reservations
    new_reservations = [res for res in reservations if res['id'] != id]

    if len(new_reservations) == len(reservations):
        return jsonify({'message': 'Errore: Prenotazione non trovata!'}), 404

    reservations = new_reservations
    return jsonify({'message': 'Prenotazione cancellata con successo!'}), 200

# Avvio dell'app Flask
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
