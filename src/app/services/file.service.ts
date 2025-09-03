// dat-fs.service.ts
import { Injectable } from '@angular/core';
import { openDB } from 'idb';

@Injectable({ providedIn: 'root' })
export class FileService {
    private dbPromise = openDB('dat-fs', 2, {
        upgrade(db, oldVersion) { 
            // Si la versión anterior era menor a 2, recrear el store
            if (oldVersion < 2) {
                // Eliminar el store anterior si existe
                if (db.objectStoreNames.contains('handles')) {
                    db.deleteObjectStore('handles');
                }
            }
            // Crear el store
            if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
            }
        }
    });

    private async saveHandle(key: string, handle: any) {
        try {
            const db = await this.dbPromise;
            await db.put('handles', handle, key); // FileSystem*Handle se puede guardar en IndexedDB
        } catch (error) {
            console.error('Error saving handle to IndexedDB:', error);
            // En caso de error, continuar sin persistir
        }
    }

    // Método público para guardar carpeta de guardado
    async saveSaveDirectory(handle: FileSystemDirectoryHandle) {
        await this.saveHandle('saveDir', handle);
    }

    // 7) Obtener la carpeta de guardado actual (útil para el historial)
    async getCurrentSaveDirectory(): Promise<FileSystemDirectoryHandle | null> {
        return this.restoreSaveDirectory();
    }
    private async loadHandle<T>(key: string): Promise<T | null> {
        try {
            const db = await this.dbPromise;
            return (await db.get('handles', key)) ?? null;
        } catch (error) {
            console.error('Error loading handle from IndexedDB:', error);
            return null;
        }
    }

    // 1) Usuario elige carpeta de lectura (autorrefractiones)
    async pickReadDirectory(): Promise<FileSystemDirectoryHandle | null> {
        const dir = await (window as any).showDirectoryPicker?.();
        if (!dir) return null;
        // guardamos
        await this.saveHandle('readDir', dir);
        return dir;
    }

    // 1b) Usuario elige carpeta de guardado (exportaciones)
    async pickSaveDirectory(): Promise<FileSystemDirectoryHandle | null> {
        const dir = await (window as any).showDirectoryPicker?.();
        if (!dir) return null;
        // guardamos
        await this.saveHandle('saveDir', dir);
        return dir;
    }

    // 2) Intentar restaurar carpeta de lectura
    async restoreReadDirectory(): Promise<FileSystemDirectoryHandle | null> {
        const dir = await this.loadHandle<FileSystemDirectoryHandle>('readDir');
        return dir ?? null; // NO pidas permisos acá
    }

    // 2b) Intentar restaurar carpeta de guardado
    async restoreSaveDirectory(): Promise<FileSystemDirectoryHandle | null> {
        const dir = await this.loadHandle<FileSystemDirectoryHandle>('saveDir');
        return dir ?? null; // NO pidas permisos acá
    }



    // Método legacy para compatibilidad (usa carpeta de lectura)
    async pickDatDirectory(): Promise<FileSystemDirectoryHandle | null> {
        return this.pickReadDirectory();
    }

    // Método legacy para compatibilidad (usa carpeta de lectura)
    async restoreDirectory(): Promise<FileSystemDirectoryHandle | null> {
        return this.restoreReadDirectory();
    }
    
    // 3) Pedir/verificar permisos de lectura
    async verifyPermission(handle: FileSystemHandle, readWrite = false): Promise<boolean> {
        const opts: any = { mode: readWrite ? 'readwrite' : 'read' };
        // @ts-ignore
        if ('queryPermission' in handle) {
            // @ts-ignore
            let perm = await (handle as any).queryPermission(opts);
            if (perm === 'granted') return true;
            // @ts-ignore
            perm = await (handle as any).requestPermission(opts);
            return perm === 'granted';
        }
        return false;
    }

    // 4) Buscar el .dat más reciente dentro de la carpeta
    async readLatestDatText(dir: FileSystemDirectoryHandle | null): Promise<{ name: string, text: string } | null> {
        const files: { name: string; handle: FileSystemFileHandle; lastModified: number }[] = [];
        if (!dir) return null;
        // Iterar entradas de la carpeta
        // for-await funciona en handles
        // @ts-ignore
        for await (const [name, handle] of (dir as any).entries()) {
            if (handle.kind === 'file' && name.toLowerCase().endsWith('.dat')) {
                const file = await (handle as FileSystemFileHandle).getFile();
                files.push({ name, handle, lastModified: file.lastModified });
            }
        }

        if (!files.length) return null;
        files.sort((a, b) => b.lastModified - a.lastModified); // más nuevo primero
        const latest = files[0];
        const text = await (await latest.handle.getFile()).text();
        return { name: latest.name, text };
    }

    // 5) Listar todos los archivos .dat de una carpeta (para historial)
    async listAllDatFiles(dir: FileSystemDirectoryHandle | null): Promise<{ name: string, lastModified: number, size: number }[]> {
        const files: { name: string, lastModified: number, size: number }[] = [];
        if (!dir) return files;
        
        try {
            // @ts-ignore
            for await (const [name, handle] of (dir as any).entries()) {
                if (handle.kind === 'file' && name.toLowerCase().endsWith('.dat')) {
                    const file = await (handle as FileSystemFileHandle).getFile();
                    files.push({ 
                        name, 
                        lastModified: file.lastModified,
                        size: file.size
                    });
                }
            }
            // Ordenar por fecha de modificación (más reciente primero)
            files.sort((a, b) => b.lastModified - a.lastModified);
        } catch (error) {
            console.error('Error listing files:', error);
        }
        
        return files;
    }

    // 6) Leer un archivo específico por nombre
    async readSpecificDatFile(dir: FileSystemDirectoryHandle | null, filename: string): Promise<{ name: string, text: string } | null> {
        if (!dir) return null;
        
        try {
            const fileHandle = await (dir as any).getFileHandle(filename);
            const file = await fileHandle.getFile();
            const text = await file.text();
            return { name: filename, text };
        } catch (error) {
            console.error('Error reading specific file:', error);
            return null;
        }
    }


    async queryPerm(handle: FileSystemHandle, readWrite = false): Promise<PermissionState> {
        if ('queryPermission' in handle) {
            // @ts-ignore
            return (handle as any).queryPermission({ mode: readWrite ? 'readwrite' : 'read' });
        }
        return 'denied';
    }

    async requestPermWithUserGesture(handle: FileSystemHandle, readWrite = false): Promise<PermissionState> {
        // LLAMAR SOLO DESDE UN CLICK
        if ('requestPermission' in handle) {
            // @ts-ignore
            return (handle as any).requestPermission({ mode: readWrite ? 'readwrite' : 'read' });
        }
        return 'denied';
    }

    // 8) Detectar si NO estamos en contexto seguro (mejorado)
    // 8) Detectar si NO estamos en contexto seguro (mejorado)
    isInsecureContext(): boolean {
        // Si tenemos File System Access API disponible, entonces estamos en contexto seguro
        if ('showDirectoryPicker' in window) {
            return false;
        }
        
        // Verificar si realmente NO estamos en contexto seguro
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Si no es HTTPS ni localhost, verificar si el navegador realmente considera esto seguro
        if (!isHttps && !isLocalhost) {
            // Si isSecureContext es true pero no tenemos la API, entonces hay un problema
            return !window.isSecureContext;
        }
        
        return false;
    }

    // 9) Abrir Chrome flags y copiar origin al portapapeles
    async openChromeFlags(): Promise<void> {
        const origin = window.location.origin;
        
        // Primero intentar abrir la pestaña
        const flagsUrl = 'chrome://flags/#unsafely-treat-insecure-origin-as-secure';
        
        try {
            // Intentar abrir nueva pestaña
            const newTab = window.open(flagsUrl, '_blank');
            
            // Si no se pudo abrir (bloqueado por popup), mostrar instrucciones
            if (!newTab || newTab.closed || typeof newTab.closed == 'undefined') {
                console.warn('Popup bloqueado, usando fallback');
                // Crear un enlace temporal y hacer click
                const link = document.createElement('a');
                link.href = flagsUrl;
                link.target = '_blank';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Error opening tab:', error);
            // Fallback: mostrar instrucciones para abrir manualmente
            alert(`No se pudo abrir automáticamente. Ve manualmente a: ${flagsUrl}`);
        }
        
        // Intentar copiar al portapapeles
        try {
            // Verificar si la API de clipboard está disponible
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(origin);
                console.log('Origin copiado al portapapeles via Clipboard API');
            } else {
                throw new Error('Clipboard API no disponible');
            }
        } catch (error) {
            console.warn('Clipboard API falló, usando método alternativo:', error);
            // Fallback: crear un elemento temporal para copiar
            try {
                const textArea = document.createElement('textarea');
                textArea.value = origin;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    console.log('Origin copiado al portapapeles via execCommand');
                } else {
                    console.warn('No se pudo copiar automáticamente');
                }
            } catch (fallbackError) {
                console.error('Error en fallback de clipboard:', fallbackError);
            }
        }
        
        return Promise.resolve();
    }

    // 10) Verificar si File System Access API está disponible
    isFileSystemAccessSupported(): boolean {
        return 'showDirectoryPicker' in window;
    }

    // 11) Método de debugging para verificar el estado de seguridad
    getSecurityDebugInfo(): any {
        return {
            isSecureContext: window.isSecureContext,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            port: window.location.port,
            origin: window.location.origin,
            hasFileSystemAPI: 'showDirectoryPicker' in window,
            hasIndexedDB: 'indexedDB' in window,
            userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                      navigator.userAgent.includes('Edge') ? 'Edge' : 'Other'
        };
    }

}
