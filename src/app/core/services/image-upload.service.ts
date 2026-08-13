import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ConfigService } from './config.service';

/// Lo que devuelve el backend: solo el nombre del archivo ya guardado.
interface RespuestaSubida {
    name: string;
}

/**
 * Subida de imágenes al backend.
 *
 * Hasta ahora el panel no subía archivos: los campos de imagen eran texto donde
 * se pegaba una URL, así que había que alojar la imagen en otra parte primero.
 *
 * El endpoint redimensiona a 600 px de ancho y acepta hasta 10 MB.
 */
@Injectable({
    providedIn: 'root'
})
export class ImageUploadService {
    /** Lo que acepta el backend, que rechaza cualquier cosa que no sea imagen. */
    static readonly TIPOS_ACEPTADOS = 'image/*';

    /** 10 MB, el mismo límite que aplica el servidor. */
    static readonly TAMANO_MAXIMO = 10 * 1024 * 1024;

    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    /**
     * Sube el archivo y devuelve la **URL absoluta** de la imagen.
     *
     * Absoluta y no el nombre suelto porque es lo que ya guardan estos campos y
     * lo que la app móvil pinta tal cual con `Image.network`: devolver solo el
     * nombre obligaría a cambiar también la app y el resto de formularios.
     */
    subir(archivo: File): Observable<string> {
        const datos = new FormData();
        // El nombre del campo lo fija el backend: r.FormFile("file").
        datos.append('file', archivo);

        return this.http
            .post<RespuestaSubida>(`${this.config.apiUrl}/api/images/upload`, datos)
            .pipe(map(res => `${this.config.apiUrl}/api/images/${res.name}`));
    }

    /**
     * Por qué un archivo no se puede subir, o `null` si sí se puede. Se valida
     * antes de enviar para no gastar la subida de 10 MB en un error previsible.
     */
    validar(archivo: File): string | null {
        if (!archivo.type.startsWith('image/')) {
            return 'El archivo debe ser una imagen.';
        }
        if (archivo.size > ImageUploadService.TAMANO_MAXIMO) {
            return 'La imagen supera los 10 MB.';
        }
        return null;
    }
}
