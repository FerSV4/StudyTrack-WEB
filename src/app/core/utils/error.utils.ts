export function mapSupaApiError(error: any): string {
  if (!error) return 'Ocurrió un error.';

  const errorMessage = (error.message || error.error_description || '').toLowerCase();

  if (errorMessage.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }

  if (errorMessage.includes('jwt expired')) {
    return 'Sesion caducada. inicia sesión nuevamente.';
  }

  if (errorMessage.includes('duplicate key value')) {
    return 'Ya existe un evento igual en tu agenda.';
  }

  if (errorMessage.includes('network error') || errorMessage.includes('fetch error')) {
    return 'Problemas de conexión. Verifica internet.';
  }

  return 'Error.';
}

//Diccionario de errores
