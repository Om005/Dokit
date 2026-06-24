type Listener = (active: boolean) => void;
let isMaintenanceActive = false;
const listeners = new Set<Listener>();

export function setMaintenanceMode(active: boolean) {
    if (isMaintenanceActive === active) return;
    isMaintenanceActive = active;
    listeners.forEach((l) => l(active));
}

export function getMaintenanceMode() {
    return isMaintenanceActive;
}

export function subscribeMaintenanceMode(listener: Listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
