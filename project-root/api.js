const API_URL = 'http://localhost:3000/eventos';

// Función para obtener todos los eventos
export async function fetchEvents() {
    try {
        const response = await fetch(API_URL);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        throw error;
    }
}

// Función para crear un evento
export async function createEvent(newEvent) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newEvent),
        });
        return await response.json();
    } catch (error) {
        console.error('Error al crear evento:', error);
        throw error;
    }
}

// Función para editar un evento
export async function editEvent(eventId, updatedEvent) {
    try {
        const response = await fetch(`${API_URL}/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedEvent),
        });
        return await response.json();
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        throw error;
    }
}

// Función para eliminar un evento
export async function deleteEvent(eventId) {
    try {
        const response = await fetch(`${API_URL}/${eventId}`, {
            method: 'DELETE',
        });
        return response.status === 200;
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        throw error;
    }
}

export async function loadEventsForUser() {
    try {
        const events = await fetchEvents();
        const eventList = document.getElementById('eventList');
        eventList.innerHTML = ''; // Limpia la lista de eventos

        events.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.innerHTML = `
                <h3>${event.name}</h3>
                <p>${event.description}</p>
                <p><strong>Capacidad:</strong> ${event.capacity}</p>
                <p><strong>Fecha:</strong> ${event.date}</p>
                <button class="inscribeBtn" data-id="${event.id}">Inscribirse</button>
            `;
            eventList.appendChild(eventItem);
        });

        // Agrega eventos de clic a los botones de inscripción
        const inscribeButtons = document.querySelectorAll('.inscribeBtn');
        inscribeButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const eventId = e.target.getAttribute('data-id');
                const event = events.find(ev => String(ev.id) === String(eventId)); // Asegura que la comparación sea correcta

                if (event && event.capacity > 0) {
                    event.capacity--; // Reduce la capacidad del evento
                    await updateEventCapacity(eventId, event.capacity);
                    alert(`Te has inscrito en el evento: ${event.name}`);
                    loadEventsForUser(); // Recarga la lista de eventos
                } else if (event) {
                    alert('No se puede inscribir, capacidad máxima alcanzada.');
                } else {
                    alert('Evento no encontrado.');
                }
            });
        });
    } catch (error) {
        console.error('Error al cargar eventos:', error);
    }
}

// Función para actualizar la capacidad del evento
export async function updateEventCapacity(eventId, newCapacity) {
    try {
        const updatedEvent = { capacity: newCapacity };
        await editEvent(eventId, updatedEvent);
    } catch (error) {
        console.error('Error al actualizar la capacidad del evento:', error);
    }
}

export async function registerUser(newUser) {
    try {
        const response = await fetch('http://localhost:3000/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });

        if (response.ok) {
            return { success: true, message: 'Usuario registrado con éxito.' };
        } else {
            const errorMessage = await response.text();
            console.error('Error en la respuesta del servidor:', errorMessage);
            return { success: false, message: 'Error al registrar el usuario. Intenta nuevamente.' };
        }
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        return { success: false, message: 'Error al registrar el usuario. Intenta nuevamente.' };
    }
}