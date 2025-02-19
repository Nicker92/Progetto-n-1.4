// Esegui il codice dopo il caricamento del DOM
document.addEventListener("DOMContentLoaded", function () {
    // Gestione del form di prenotazione
    const bookingForm = document.getElementById("booking-form");
    bookingForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(bookingForm);
        const data = Object.fromEntries(formData);
        // Controllo se la data è nel passato
        const selectedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            showPopup("Errore: Non puoi prenotare per una data passata!", "error");
            return;
        }

        try {
             // Invia richiesta POST per creare una prenotazione
            const response = await fetch("/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            showPopup(result.message, response.ok ? "success" : "error");

            if (response.ok) {
                bookingForm.reset();
            }
        } catch (error) {
            showPopup("Errore di connessione al server!", "error");
        }
    });

    // Gestione del form per visualizzare prenotazioni
    const manageForm = document.getElementById("manage-form");
    manageForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email-manage").value;
        try {
            const response = await fetch(`/reservations?email=${email}`);
            const reservations = await response.json();

            if (!Array.isArray(reservations)) {
                showPopup("Errore nel recupero delle prenotazioni!", "error");
                return;
            }

            const reservationsList = document.getElementById("reservations-list");
            reservationsList.innerHTML = "";

            if (reservations.length > 0) {
                reservations.forEach((res) => {
                    const div = document.createElement("div");
                    div.className = "reservation";
                    div.innerHTML = `
                        <p><strong>Servizio:</strong> ${res.service}</p>
                        <p><strong>Data:</strong> ${res.date}</p>
                        <p><strong>Ora:</strong> ${res.time}</p>
                        <button onclick="editReservation(${res.id}, '${res.service}', '${res.date}', '${res.time}')">Modifica</button>
                        <button onclick="deleteReservation(${res.id})">Cancella</button>
                    `;
                    reservationsList.appendChild(div);
                });
            } else {
                showPopup("Nessuna prenotazione trovata.", "error");
            }
        } catch (error) {
            showPopup("Errore nel recupero delle prenotazioni!", "error");
        }
    });

    // Funzione per mostrare popup informativi
    function showPopup(message, type) {
        const popup = document.createElement("div");
        popup.className = `popup ${type}`;
        popup.innerHTML = `<p>${message}</p>`;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.remove();
        }, 4000);
    }

     // Funzione per modificare una prenotazione
    window.editReservation = function (id, service, date, time) {
        const availableServices = ["Massaggio", "Accesso alla Spa", "Trattamento Viso"];

        const formDiv = document.createElement("div");
        formDiv.className = "modal";
        formDiv.innerHTML = `
            <div class="modal-content">
                <h3>Modifica Prenotazione</h3>
                <label>Servizio:</label>
                <select id="newService">
                    ${availableServices.map(s => `<option value="${s}" ${s === service ? "selected" : ""}>${s}</option>`).join("")}
                </select>
                <label>Data:</label>
                <input type="date" id="newDate" value="${date}">
                <label>Ora:</label>
                <input type="time" id="newTime" value="${time}">
                <button onclick="submitEdit(${id})">Salva</button>
                <button onclick="closeModal()">Annulla</button>
            </div>
        `;
        document.body.appendChild(formDiv);
    };

    window.submitEdit = function (id) {
        const newService = document.getElementById("newService").value;
        const newDate = document.getElementById("newDate").value;
        const newTime = document.getElementById("newTime").value;

        fetch(`/reservations/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service: newService, date: newDate, time: newTime }),
        })
            .then(async (response) => {
                const result = await response.json();
                if (response.ok) {
                    showPopup(result.message, "success");
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showPopup(result.message, "error");
                }
            })
            .catch(() => {
                showPopup("Errore di connessione!", "error");
            });

        closeModal();
    };

    window.closeModal = function () {
        document.querySelector(".modal").remove();
    };

    window.deleteReservation = function (id) {
        // Creazione un popup personalizzato per la conferma
        const confirmDiv = document.createElement("div");
        confirmDiv.className = "modal";
        confirmDiv.innerHTML = `
            <div class="modal-content">
                <h3>Conferma Cancellazione</h3>
                <p>Sei sicuro di voler cancellare questa prenotazione?</p>
                <button onclick="confirmDelete(${id})">Sì, Cancella</button>
                <button onclick="closeModal()">Annulla</button>
            </div>
        `;
        document.body.appendChild(confirmDiv);
    };

    window.confirmDelete = function (id) {
        fetch(`/reservations/${id}`, {
            method: "DELETE",
        })
            .then(async (response) => {
                const result = await response.json();
                showPopup(result.message, response.ok ? "success" : "error");
                if (response.ok) {
                    setTimeout(() => location.reload(), 1000);
                }
            })
            .catch(() => showPopup("Errore di connessione!", "error"));

        closeModal();
    };

});
