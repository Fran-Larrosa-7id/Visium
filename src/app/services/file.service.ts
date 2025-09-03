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

    // 9) Generar y descargar archivo .bat para configurar política de registro
    downloadSecurityPolicyBat(): void {
        const origin = window.location.origin;
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        const batContent = `@echo off
REM Configurar Chrome/Edge para tratar ${origin} como origen seguro
REM Esto habilita File System Access API en el origen especificado

echo ========================================
echo CONFIGURANDO ORIGEN SEGURO
echo ========================================
echo Origin: ${origin}
echo Protocol: ${protocol}
echo Hostname: ${hostname}
echo Port: ${port}
echo ========================================

REM Matar todos los procesos de navegadores
echo Cerrando navegadores...
taskkill /f /im chrome.exe >nul 2>&1
taskkill /f /im msedge.exe >nul 2>&1
timeout /t 2 >nul

echo Configurando politica de seguridad...

REM Crear claves de registro para Chrome (Sistema)
reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome" /f >nul 2>&1
reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome" /v "OverrideSecurityRestrictionsOnInsecureOrigin" /t REG_SZ /d "${origin}" /f
echo Chrome (Sistema): OK

REM Crear claves de registro para Edge (Sistema)  
reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Edge" /f >nul 2>&1
reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "OverrideSecurityRestrictionsOnInsecureOrigin" /t REG_SZ /d "${origin}" /f
echo Edge (Sistema): OK

REM Crear claves de registro para Chrome (Usuario)
reg add "HKEY_CURRENT_USER\\SOFTWARE\\Policies\\Google\\Chrome" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\\SOFTWARE\\Policies\\Google\\Chrome" /v "OverrideSecurityRestrictionsOnInsecureOrigin" /t REG_SZ /d "${origin}" /f
echo Chrome (Usuario): OK

REM Crear claves de registro para Edge (Usuario)
reg add "HKEY_CURRENT_USER\\SOFTWARE\\Policies\\Microsoft\\Edge" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "OverrideSecurityRestrictionsOnInsecureOrigin" /t REG_SZ /d "${origin}" /f
echo Edge (Usuario): OK

REM Tambien agregar variantes con y sin puerto por si acaso
REM Solo el hostname con puerto
set HOST_WITH_PORT=${hostname}:${port}
reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome" /v "OverrideSecurityRestrictionsOnInsecureOrigin" /t REG_SZ /d "${protocol}//%HOST_WITH_PORT%" /f >nul 2>&1
reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "OverrideSecurityRestrictionsOnInsecureOrigin" /t REG_SZ /d "${protocol}//%HOST_WITH_PORT%" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\\SOFTWARE\\Policies\\Google\\Chrome" /v "OverrideSecurityRestrictionsOnInsecureOrigin" /t REG_SZ /d "${protocol}//%HOST_WITH_PORT%" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\\SOFTWARE\\Policies\\Microsoft\\Edge" /v "OverrideSecurityRestrictionsOnInsecureOrigin" /t REG_SZ /d "${protocol}//%HOST_WITH_PORT%" /f >nul 2>&1

echo.
echo ============================================
echo CONFIGURACION COMPLETADA
echo ============================================
echo.
echo El origen ${origin} ha sido configurado como seguro.
echo.
echo PASOS IMPORTANTES:
echo 1. ✓ Navegadores cerrados automaticamente
echo 2. ✓ Politicas de registro aplicadas
echo 3. → ABRE EL NAVEGADOR NUEVAMENTE
echo 4. → Ve a: ${origin}
echo 5. → Presiona F12 y en consola escribe: isSecureContext
echo 6. → Deberia devolver: true
echo.
echo Si sigue devolviendo false, REINICIA EL SISTEMA
echo.
pause`;

        // Crear blob y descargar
        const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `configurar-origen-seguro-${window.location.hostname}-${window.location.port || '80'}.bat`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
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
