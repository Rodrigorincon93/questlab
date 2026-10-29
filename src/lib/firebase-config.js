// Configuración pública de la app web de Firebase (proyecto questlab-34de7).
// Estos valores no son secretos: identifican el proyecto. La seguridad la dan
// las reglas de Firestore (firestore.rules).
export const firebaseConfig = {
  apiKey: 'AIzaSyCem5c852cS8q_Vz1ylRYrLyZZtsX2meYY',
  authDomain: 'questlab-34de7.firebaseapp.com',
  projectId: 'questlab-34de7',
  storageBucket: 'questlab-34de7.firebasestorage.app',
  messagingSenderId: '1075189162133',
  appId: '1:1075189162133:web:1bea005c1bab77d52d7b9c',
}

// Cuentas con permiso de administrador (pueden autorizar docentes).
// Debe coincidir con la lista de firestore.rules.
export const ADMIN_EMAILS = ['rodrigorincon9301@gmail.com']
