// dat-fs.service.ts
import { Injectable } from '@angular/core';
import { openDB } from 'idb';

@Injectable({ providedIn: 'root' })
export class FileService {
    private dbPromise = openDB('dat-fs', 1, {
        upgrade(db) { db.createObjectStore('handles'); }
    });

    // HACK: Override para forzar contexto seguro (obviar restricción HTTPS)
    constructor() {
        // Forzar que el navegador piense que está en contexto seguro
        if (!(window as any).isSecureContext) {
            Object.defineProperty(window, 'isSecureContext', {
                value: true,
                writable: false
            });
        }
    }

    private async saveHandle(key: string, handle: any) {
        const db = await this.dbPromise;
        await db.put('handles', handle, key); // FileSystem*Handle se puede guardar en IndexedDB
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
        const db = await this.dbPromise;
        return (await db.get('handles', key)) ?? null;
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


}
