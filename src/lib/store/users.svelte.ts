import { getAllUsers } from '../schema/sdk.gen';

let users: string[] | null = null;
let currentFetch: Promise<void> | null = null;
const subscribers = new Set<() => void>();

export async function fetchUsers() {
    if (currentFetch) {
        return currentFetch;
    }

    currentFetch = (async () => {
        try {
            let res = await getAllUsers();
            if (res.error) {
                users = null;
            } else {
                if (res.data?.status === 'Error') {
                    users = null;
                } else {
                    users = res.data?.message ?? null;
                }
            }
            notify();
        } finally {
            currentFetch = null;
        }
    })();

    return currentFetch;
}

export function getUsers() {
    return users;
}

function notify() {
    subscribers.forEach(fn => fn());
}

export function subscribe(fn: () => void) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
}