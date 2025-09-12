// dat-fs.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileService {
    fileSaved = signal<boolean>(false);
    // URL base donde están hosteados los archivos .dat
    // private readonly BASE_URL = 'http://181.29.107.180:5103/treelan/estudios/test/';
    private readonly BASE_URL = 'http://localhost/treelan/datLectura/';
    private readonly DOWNLOAD_URL = 'http://localhost/treelan/datDownload/';
    private readonly UPLOAD_SCRIPT = 'http://localhost/treelan/datDownload/upload.php';
    
    constructor() {}

    /**
     * Obtiene la lista de archivos .dat disponibles desde el servidor
     * Hace una petición HTTP GET para obtener el directorio
     */
    async getAvailableDatFiles(): Promise<{ name: string, lastModified: number, size: number }[]> {
        try {
            const response = await fetch(this.BASE_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Parsear el HTML del directorio para encontrar archivos .dat
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href$=".dat"]');
            
            const files: { name: string, lastModified: number, size: number }[] = [];
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.dat')) {
                    // Extraer información del archivo desde el HTML del directorio Apache
                    const row = link.closest('tr');
                    let lastModified = Date.now();
                    let size = 0;
                    
                    if (row) {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 3) {
                            // Intentar parsear fecha (formato típico de Apache)
                            const dateText = cells[1]?.textContent?.trim();
                            if (dateText) {
                                const parsedDate = new Date(dateText);
                                if (!isNaN(parsedDate.getTime())) {
                                    lastModified = parsedDate.getTime();
                                }
                            }
                            
                            // Intentar parsear tamaño
                            const sizeText = cells[2]?.textContent?.trim();
                            if (sizeText && sizeText !== '-') {
                                const sizeMatch = sizeText.match(/(\d+(?:\.\d+)?)\s*([KMGT]?B?)/i);
                                if (sizeMatch) {
                                    let fileSize = parseFloat(sizeMatch[1]);
                                    const unit = sizeMatch[2].toUpperCase();
                                    
                                    switch (unit) {
                                        case 'KB': fileSize *= 1024; break;
                                        case 'MB': fileSize *= 1024 * 1024; break;
                                        case 'GB': fileSize *= 1024 * 1024 * 1024; break;
                                        case 'TB': fileSize *= 1024 * 1024 * 1024 * 1024; break;
                                    }
                                    size = Math.round(fileSize);
                                }
                            }
                        }
                    }
                    
                    files.push({
                        name: href,
                        lastModified,
                        size
                    });
                }
            });
            
            // Ordenar por fecha de modificación (más reciente primero)
            files.sort((a, b) => b.lastModified - a.lastModified);
            
            return files;
        } catch (error) {
            console.error('Error getting available .dat files:', error);
            return [];
        }
    }

    /**
     * Lee el contenido de un archivo .dat específico desde el servidor
     */
    async readDatFile(filename: string): Promise<{ name: string, text: string } | null> {
        try {
            const url = `${this.BASE_URL}${filename}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            return { name: filename, text };
        } catch (error) {
            console.error('Error reading .dat file:', error);
            return null;
        }
    }

    /**
     * Lee el archivo .dat más reciente disponible
     */
    async readLatestDatText(): Promise<{ name: string, text: string } | null> {
        try {
            const files = await this.getAvailableDatFiles();
            if (files.length === 0) {
                console.warn('No .dat files found');
                return null;
            }
            
            // Tomar el archivo más reciente (ya están ordenados por fecha)
            const latestFile = files[0];
            return await this.readDatFile(latestFile.name);
        } catch (error) {
            console.error('Error reading latest .dat file:', error);
            return null;
        }
    }

    /**
     * Listar todos los archivos .dat disponibles (para historial)
     */
    async listAllDatFiles(): Promise<{ name: string, lastModified: number, size: number }[]> {
        return await this.getAvailableDatFiles();
    }

    /**
     * Leer un archivo específico por nombre (para historial)
     */
    async readSpecificDatFile(filename: string): Promise<{ name: string, text: string } | null> {
        return await this.readDatFile(filename);
    }

    /**
     * Guarda un archivo .dat en el servidor usando HTTP POST
     */
    async saveDatFile(filename: string, content: string): Promise<boolean> {
        try {
            const formData = new FormData();
            formData.append('filename', filename);
            formData.append('content', content);
            
            const response = await fetch(this.UPLOAD_SCRIPT, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.fileSaved.set(true);
            console.log('Archivo guardado exitosamente en el servidor:', filename, result);
            return true;
        } catch (error) {
            console.error('Error saving .dat file to server:', error);
            return false;
        }
    }

    /**
     * Obtiene la lista de archivos .dat del historial (carpeta de descarga/guardado)
     */
    async getHistoryDatFiles(): Promise<{ name: string, lastModified: number, size: number }[]> {
        try {
            const response = await fetch(this.DOWNLOAD_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Parsear el HTML del directorio para encontrar archivos .dat
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href$=".dat"]');
            
            const files: { name: string, lastModified: number, size: number }[] = [];
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.dat')) {
                    // Extraer información del archivo desde el HTML del directorio Apache
                    const row = link.closest('tr');
                    let lastModified = Date.now();
                    let size = 0;
                    
                    if (row) {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 3) {
                            // Intentar parsear fecha (formato típico de Apache)
                            const dateText = cells[1]?.textContent?.trim();
                            if (dateText) {
                                const parsedDate = new Date(dateText);
                                if (!isNaN(parsedDate.getTime())) {
                                    lastModified = parsedDate.getTime();
                                }
                            }
                            
                            // Intentar parsear tamaño
                            const sizeText = cells[2]?.textContent?.trim();
                            if (sizeText && sizeText !== '-') {
                                const sizeMatch = sizeText.match(/(\d+(?:\.\d+)?)\s*([KMGT]?B?)/i);
                                if (sizeMatch) {
                                    let fileSize = parseFloat(sizeMatch[1]);
                                    const unit = sizeMatch[2].toUpperCase();
                                    
                                    switch (unit) {
                                        case 'KB': fileSize *= 1024; break;
                                        case 'MB': fileSize *= 1024 * 1024; break;
                                        case 'GB': fileSize *= 1024 * 1024 * 1024; break;
                                        case 'TB': fileSize *= 1024 * 1024 * 1024 * 1024; break;
                                    }
                                    size = Math.round(fileSize);
                                }
                            }
                        }
                    }
                    
                    files.push({
                        name: href,
                        lastModified,
                        size
                    });
                }
            });
            
            // Ordenar por fecha de modificación (más reciente primero)
            files.sort((a, b) => b.lastModified - a.lastModified);
            
            return files;
        } catch (error) {
            console.error('Error getting history .dat files:', error);
            return [];
        }
    }

    /**
     * Lee un archivo específico del historial por nombre
     */
    async readHistoryDatFile(filename: string): Promise<{ name: string, text: string } | null> {
        try {
            const url = `${this.DOWNLOAD_URL}${filename}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            return { name: filename, text };
        } catch (error) {
            console.error('Error reading history .dat file:', error);
            return null;
        }
    }

    // Métodos simplificados para mantener compatibilidad con el código existente
    
    /**
     * Verifica si el servicio está disponible (siempre true para HTTP)
     */
    isFileSystemAccessSupported(): boolean {
        return true; // HTTP siempre está disponible
    }

    /**
     * Verifica si estamos en contexto inseguro (ya no aplica con HTTP)
     */
    isInsecureContext(): boolean {
        return false; // Con HTTP ya no hay problemas de contexto seguro
    }

    /**
     * Información de debugging del estado de seguridad
     */
    getSecurityDebugInfo(): any {
        return {
            isSecureContext: window.isSecureContext,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            port: window.location.port,
            origin: window.location.origin,
            hasHttpAccess: true, // Siempre true para HTTP
            baseUrl: this.BASE_URL,
            userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                      navigator.userAgent.includes('Edge') ? 'Edge' : 'Other'
        };
    }
}
