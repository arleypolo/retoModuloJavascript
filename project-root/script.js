import { fetchEvents, editEvent, createEvent, deleteEvent } from './api.js';

const app = document.getElementById('app');

// Carga una vista desde el archivo HTML correspondiente
function loadView(viewName) {
    const viewContainer = document.querySelector('.view-container'); // Contenedor principal de vistas
    viewContainer.innerHTML = ''; // Limpia el contenido actual

    fetch(`./views/${viewName}.html`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`No se pudo cargar la vista: ${viewName}`);
            }
            return response.text();
        })
        .then((html) => {
            viewContainer.innerHTML = html; // Inserta el contenido de la vista
            attachEventHandlers(viewName); // Asocia los controladores de eventos
        })
        .catch((error) => {
            console.error('Error al cargar la vista:', error);
            alert('No se pudo cargar la vista. Por favor, intenta nuevamente.');
        });
}

// Asocia los controladores de eventos según la vista cargada
function attachEventHandlers(viewName) {
    try {
        if (viewName === 'login') {
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                await login(username, password);
            });
        } else if (viewName === 'admin') {
            document.getElementById('createEventBtn').addEventListener('click', () => loadView('create-event'));
            document.getElementById('editEventBtn').addEventListener('click', () => loadView('edit-event'));
            document.getElementById('deleteEventBtn').addEventListener('click', () => loadView('delete-event'));
            document.getElementById('logoutBtn').addEventListener('click', logout);
        } else if (viewName === 'create-event') {
            document.getElementById('createEventForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const newEvent = {
                    name: document.getElementById('eventName').value,
                    description: document.getElementById('eventDescription').value,
                    capacity: parseInt(document.getElementById('eventCapacity').value, 10),
                    date: document.getElementById('eventDate').value,
                };
                await createEvent(newEvent);
                alert('Evento creado con éxito.');
                loadView('admin'); // Regresa a la vista de administración
            });
            document.getElementById('backBtn').addEventListener('click', () => loadView('admin')); // Botón "Volver"
        } else if (viewName === 'edit-event') {
            loadEventsForEditing(); // Carga los eventos con botones de edición
            document.getElementById('backBtn').addEventListener('click', () => loadView('admin'));
        } else if (viewName === 'delete-event') {
            loadEventsForDeletion(); // Carga los eventos con botones de eliminación
            document.getElementById('backBtn').addEventListener('click', () => loadView('admin'));
        } else if (viewName === 'register') {
            document.getElementById('registerForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const newUsername = document.getElementById('newUsername').value.trim();
                const newPassword = document.getElementById('newPassword').value.trim();

                if (!newUsername || !newPassword) {
                    alert('Por favor, completa todos los campos.');
                    return;
                }

                const newUser = {
                    id: Date.now().toString(), // Genera un ID único basado en la fecha actual
                    user: newUsername,
                    password: newPassword,
                    role: 'user', // Siempre se crea con el rol de usuario
                    inscripciones: [] // Inicialmente sin inscripciones
                };

                console.log('Datos del usuario a registrar:', newUser);

                try {
                    const response = await fetch('http://localhost:3000/usuarios', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newUser)
                    });

                    console.log('Respuesta del servidor:', response);

                    if (response.ok) {
                        alert('Usuario registrado con éxito. Ahora puedes iniciar sesión.');
                        document.getElementById('registerForm').reset(); // Limpia el formulario de registro
                    } else {
                        const errorMessage = await response.text();
                        console.error('Error en la respuesta del servidor:', errorMessage);
                        alert('Error al registrar el usuario. Intenta nuevamente.');
                    }
                } catch (error) {
                    console.error('Error al registrar el usuario:', error);
                    alert('Error al registrar el usuario. Intenta nuevamente.');
                }
            });
        } else if (viewName === 'user') {
            document.getElementById('logoutBtn').addEventListener('click', logout);
            loadEventsForUser(); // Carga los eventos disponibles
        }
        // Elimina la llamada a `loadUserInscriptions`
    } catch (error) {
        console.error('Error al asociar controladores de eventos:', error);
    }
}

// Función de inicio de sesión
async function login(username, password) {
    try {
        const response = await fetch('http://localhost:3000/usuarios');
        const users = await response.json();

        const user = users.find(u => u.user === username && u.password === password);

        if (user) {
            console.log(`Bienvenido, ${user.user}. Rol: ${user.role}`);
            localStorage.setItem('currentUser', JSON.stringify(user)); // Guarda solo el usuario autenticado

            if (user.role === 'admin') {
                loadView('admin');
            } else if (user.role === 'user') {
                loadView('user');
            }
        } else {
            alert('Usuario o contraseña incorrectos.');
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('currentUser');
    alert('Has cerrado sesión.');
    loadView('login');
}

// Función para verificar la sesión al cargar la página
function checkSession() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        console.log(`Sesión activa: ${user.user}`);
        if (user.role === 'admin') {
            loadView('admin');
        } else if (user.role === 'user') {
            loadView('user');
        }
    } else {
        loadView('login');
    }
}

// Verifica la sesión al cargar la página
checkSession();

// Función para cargar los eventos con botones de eliminación
async function loadEventsForDeletion() {
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
                <button class="deleteBtn" data-id="${event.id}">Eliminar</button>
            `;
            eventList.appendChild(eventItem);
        });

        // Agrega eventos de clic a los botones de eliminación
        const deleteButtons = document.querySelectorAll('.deleteBtn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const eventId = e.target.getAttribute('data-id');
                const success = await deleteEvent(eventId);
                if (success) {
                    alert(`Evento eliminado con éxito.`);
                    loadEventsForDeletion(); // Recarga la lista de eventos
                } else {
                    alert(`Error al eliminar el evento.`);
                }
            });
        });
    } catch (error) {
        console.error('Error al cargar eventos para eliminación:', error);
    }
}

// Función para cargar los eventos con botones de edición
async function loadEventsForEditing() {
    try {
        const events = await fetchEvents();
        const eventList = document.getElementById('eventList');
        const editFormContainer = document.getElementById('editFormContainer');
        eventList.innerHTML = ''; // Limpia la lista de eventos

        events.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.innerHTML = `
                <h3>${event.name}</h3>
                <p>${event.description}</p>
                <p><strong>Capacidad:</strong> ${event.capacity}</p>
                <p><strong>Fecha:</strong> ${event.date}</p>
                <button class="editBtn" data-id="${event.id}">Editar</button>
            `;
            eventList.appendChild(eventItem);
        });

        // Agrega eventos de clic a los botones de edición
        const editButtons = document.querySelectorAll('.editBtn');
        editButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const eventId = e.target.getAttribute('data-id');
                const event = await fetch(`http://localhost:3000/eventos/${eventId}`).then(res => res.json());

                // Rellena el formulario con los datos del evento
                document.getElementById('editEventName').value = event.name;
                document.getElementById('editEventDescription').value = event.description;
                document.getElementById('editEventCapacity').value = event.capacity;
                document.getElementById('editEventDate').value = event.date;

                // Muestra el formulario de edición
                editFormContainer.style.display = 'block';

                // Maneja el envío del formulario de edición
                document.getElementById('editEventForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const updatedEvent = {
                        name: document.getElementById('editEventName').value,
                        description: document.getElementById('editEventDescription').value,
                        capacity: document.getElementById('editEventCapacity').value,
                        date: document.getElementById('editEventDate').value,
                    };
                    await editEvent(eventId, updatedEvent);
                    alert(`Evento actualizado con éxito.`);
                    loadEventsForEditing(); // Recarga la lista de eventos
                    editFormContainer.style.display = 'none'; // Oculta el formulario
                });

                // Maneja la cancelación de la edición
                document.getElementById('cancelEditBtn').addEventListener('click', () => {
                    editFormContainer.style.display = 'none'; // Oculta el formulario
                });
            });
        });
    } catch (error) {
        console.error('Error al cargar eventos para edición:', error);
    }
}

// Función para cargar los eventos disponibles para inscripción
async function loadEventsForUser() {
    try {
        const events = await fetchEvents(); // Obtiene los eventos desde el servidor
        const currentUser = JSON.parse(localStorage.getItem('currentUser')); // Obtiene el usuario actual
        const eventList = document.getElementById('eventList');
        eventList.innerHTML = ''; // Limpia la lista de eventos

        events.forEach(event => {
            const isInscribed = currentUser.inscripciones.includes(event.id); // Verifica si el usuario está inscrito en el evento
            const eventRow = document.createElement('tr'); // Crea una fila para cada evento
            eventRow.innerHTML = `
                <td>${event.name}</td>
                <td>${event.description}</td>
                <td>${event.capacity}</td>
                <td>${event.date}</td>
                <td>
                    <button class="inscribeBtn" data-id="${event.id}" ${isInscribed ? 'disabled' : ''}>
                        ${isInscribed ? 'Inscrito' : 'Inscribirse'}
                    </button>
                </td>
            `;
            eventList.appendChild(eventRow); // Agrega la fila a la tabla
        });

        // Agrega eventos de clic a los botones de inscripción
        const inscribeButtons = document.querySelectorAll('.inscribeBtn');
        inscribeButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const eventId = e.target.getAttribute('data-id');
                const event = events.find(ev => String(ev.id) === String(eventId)); // Encuentra el evento correspondiente

                if (event && event.capacity > 0) {
                    await updateEventCapacity(eventId, { ...event, capacity: event.capacity - 1 }); // Actualiza la capacidad en el servidor
                    currentUser.inscripciones.push(eventId); // Agrega el evento a las inscripciones del usuario
                    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Actualiza el usuario en localStorage
                    alert(`Te has inscrito en el evento: ${event.name}`);
                    loadEventsForUser(); // Recarga la lista de eventos desde el servidor
                } else if (event) {
                    alert('No se puede inscribir, capacidad máxima alcanzada.');
                } else {
                    alert('Evento no encontrado.');
                }
            });
        });
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        alert('Error al cargar los eventos. Por favor, intenta nuevamente.');
    }
}

// Función para cargar los eventos en los que el usuario está inscrito
async function loadUserInscriptions() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch(`http://localhost:3000/usuarios/${currentUser.id}`);
        const user = await response.json();
        const inscriptionsList = document.getElementById('inscriptionsList');
        inscriptionsList.innerHTML = ''; // Limpia la lista de inscripciones

        user.inscripciones.forEach(async eventId => {
            const event = await fetch(`http://localhost:3000/eventos/${eventId}`).then(res => res.json());
            const inscriptionItem = document.createElement('div');
            inscriptionItem.innerHTML = `
                <h3>${event.name}</h3>
                <p>${event.description}</p>
                <p><strong>Fecha:</strong> ${event.date}</p>
            `;
            inscriptionsList.appendChild(inscriptionItem);
        });
    } catch (error) {
        console.error('Error al cargar inscripciones del usuario:', error);
        alert('Error al cargar las inscripciones. Por favor, intenta nuevamente.');
    }
}

// Función para registrar la inscripción de un usuario
async function registerUserInscription(userId, eventId) {
    try {
        const response = await fetch(`http://localhost:3000/usuarios/${userId}`);
        const user = await response.json();
        const updatedUser = { ...user, inscripciones: [...user.inscripciones, eventId] };
        await fetch(`http://localhost:3000/usuarios/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedUser),
        });
    } catch (error) {
        console.error('Error al registrar inscripción:', error);
        alert('Error al registrar la inscripción. Por favor, intenta nuevamente.');
    }
}

// Función para actualizar la capacidad del evento
async function updateEventCapacity(eventId, updatedEvent) {
    try {
        await editEvent(eventId, updatedEvent); // Envía todos los datos del evento al servidor
    } catch (error) {
        console.error('Error al actualizar la capacidad del evento:', error);
        alert('Error al actualizar la capacidad del evento. Por favor, intenta nuevamente.');
    }
}

// Agrega el controlador de evento para el botón de vista de registro
document.getElementById('registerViewBtn').addEventListener('click', () => {
    loadView('register'); // Carga la vista de registro
});