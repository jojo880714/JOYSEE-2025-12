
import { Room, User, Pairing, GameStage } from '../types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const STORAGE_KEYS = {
  ROOMS: 'santa_rooms',
  USERS: 'santa_users',
  PAIRINGS: 'santa_pairings',
};

// --- Helpers ---

const getFromStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Room API ---

export const createRoom = async (
  hostName: string,
  budgetMin: number,
  budgetMax: number,
  allowHandmade: boolean
): Promise<{ room: Room; user: User }> => {
  await delay(300);
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  
  // Generate unique 6-char code
  let code = '';
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms.find(r => r.code === code));

  const roomId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  const newRoom: Room = {
    id: roomId,
    code,
    hostId: userId,
    budgetMin,
    budgetMax,
    allowHandmade,
    isLocked: false,
    stage: GameStage.LOBBY,
    createdAt: Date.now(),
  };

  const hostUser: User = {
    id: userId,
    roomId,
    name: hostName.trim(),
    color: '',
    occasion: '',
    feeling: '',
    isHost: true,
    isReady: false,
  };

  saveToStorage(STORAGE_KEYS.ROOMS, [...rooms, newRoom]);
  saveToStorage(STORAGE_KEYS.USERS, [...getFromStorage(STORAGE_KEYS.USERS), hostUser]);

  return { room: newRoom, user: hostUser };
};

export const joinRoom = async (code: string, userName: string): Promise<{ room: Room; user: User }> => {
  await delay(300);
  const cleanCode = code.trim().toUpperCase();
  const cleanName = userName.trim();

  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  const room = rooms.find(r => r.code === cleanCode);

  if (!room) throw new Error("找不到此房間代碼。");
  
  // Check if user already exists (Re-join / Reconnect logic)
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  // Find user by name in this room (Case-insensitive match for better UX)
  // This allows BOTH Participants and Hosts to "re-login" just by entering their name again.
  const existingUser = users.find(u => 
    u.roomId === room.id && 
    u.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (existingUser) {
    // User exists, return credentials (Reconnect)
    return { room, user: existingUser };
  }

  // New User logic
  if (room.isLocked) throw new Error("房間已鎖定，無法加入。");

  // Check if name is taken by a host but not matched above (Edge case safety)
  if (users.some(u => u.roomId === room.id && u.isHost && u.name.toLowerCase() === cleanName.toLowerCase())) {
      // This should be caught by existingUser, but double check
      const host = users.find(u => u.roomId === room.id && u.isHost);
      if (host) return { room, user: host };
  }

  const userId = crypto.randomUUID();
  const newUser: User = {
    id: userId,
    roomId: room.id,
    name: cleanName,
    color: '',
    occasion: '',
    feeling: '',
    isHost: false,
    isReady: false,
  };

  saveToStorage(STORAGE_KEYS.USERS, [...users, newUser]);
  return { room, user: newUser };
};

export const loginAsHost = async (code: string, hostName: string): Promise<{ room: Room; user: User }> => {
  await delay(500);
  const cleanCode = code.trim().toUpperCase();
  const cleanName = hostName.trim();

  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  const room = rooms.find(r => r.code === cleanCode);

  if (!room) throw new Error("找不到此房間代碼。");

  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  // Find the host user in this room
  const hostUser = users.find(u => u.roomId === room.id && u.isHost);

  if (!hostUser) throw new Error("此房間資料異常，找不到主持人。");
  
  // Verify name (Case-insensitive)
  if (hostUser.name.toLowerCase() !== cleanName.toLowerCase()) {
    throw new Error(`主持人姓名驗證失敗。`);
  }

  return { room, user: hostUser };
};

export const getRoomState = async (roomId: string): Promise<{ room: Room; users: User[] }> => {
  await delay(50); 
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  const room = rooms.find(r => r.id === roomId);
  const roomUsers = users.filter(u => u.roomId === roomId);

  if (!room) throw new Error("找不到房間");
  return { room, users: roomUsers };
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<User> => {
  await delay(200);
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) throw new Error("找不到使用者");

  const updatedUser = { ...users[index], ...data };
  
  // Basic validation to check if ready
  if (updatedUser.color && updatedUser.occasion && updatedUser.feeling) {
      updatedUser.isReady = true;
  }

  users[index] = updatedUser;
  saveToStorage(STORAGE_KEYS.USERS, users);
  return updatedUser;
};

export const lockRoom = async (roomId: string): Promise<void> => {
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  const room = rooms.find(r => r.id === roomId);
  if (room) {
    room.isLocked = true;
    saveToStorage(STORAGE_KEYS.ROOMS, rooms);
  }
};

// --- Pairing Logic ---

export const generatePairings = async (roomId: string): Promise<void> => {
  await delay(500);
  const users = getFromStorage<User>(STORAGE_KEYS.USERS).filter(u => u.roomId === roomId);
  
  if (users.length < 2) throw new Error("至少需要 2 位玩家才能進行配對。");

  // Derangement Shuffle
  let attempt = 0;
  let valid = false;
  let shuffled: User[] = [];

  while (!valid && attempt < 1000) {
    shuffled = [...users].sort(() => Math.random() - 0.5);
    valid = true;
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === shuffled[i].id) {
        valid = false;
        break;
      }
    }
    attempt++;
  }

  if (!valid) throw new Error("配對失敗（無法避免抽到自己），請增加人數或重試。");

  // Remove old pairings for this room
  const allPairings = getFromStorage<Pairing>(STORAGE_KEYS.PAIRINGS);
  const otherPairings = allPairings.filter(p => p.roomId !== roomId);

  const newPairings: Pairing[] = users.map((user, index) => ({
    roomId,
    angelId: user.id,
    masterId: shuffled[index].id,
  }));

  saveToStorage(STORAGE_KEYS.PAIRINGS, [...otherPairings, ...newPairings]);

  // Update Room Stage
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  const room = rooms.find(r => r.id === roomId);
  if (room) {
    room.stage = GameStage.PAIRED;
    saveToStorage(STORAGE_KEYS.ROOMS, rooms);
  }
};

export const getMyPairing = async (roomId: string, myUserId: string): Promise<{ master: User } | null> => {
  const pairings = getFromStorage<Pairing>(STORAGE_KEYS.PAIRINGS);
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  const myPairing = pairings.find(p => p.roomId === roomId && p.angelId === myUserId);
  if (!myPairing) return null;

  const master = users.find(u => u.id === myPairing.masterId);
  return master ? { master } : null;
};

export const revealGame = async (roomId: string): Promise<void> => {
  await delay(100);
  const rooms = getFromStorage<Room>(STORAGE_KEYS.ROOMS);
  const room = rooms.find(r => r.id === roomId);
  if (room) {
    room.stage = GameStage.REVEALED;
    saveToStorage(STORAGE_KEYS.ROOMS, rooms);
  }
};

export const getAllPairings = async (roomId: string): Promise<Array<{ angel: User; master: User }>> => {
  const pairings = getFromStorage<Pairing>(STORAGE_KEYS.PAIRINGS).filter(p => p.roomId === roomId);
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);

  return pairings.map(p => ({
    angel: users.find(u => u.id === p.angelId)!,
    master: users.find(u => u.id === p.masterId)!
  })).filter(p => p.angel && p.master);
};
