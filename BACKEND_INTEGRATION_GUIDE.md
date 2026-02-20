<!-- INTEGRATION_GUIDE.md -->
# How to Use Backend API in Your Game

Your backend API service is ready at: [src/services/backendApiService.ts](src/services/backendApiService.ts)

## Configuration

The backend URL is configured in `.env.local`:

```dotenv
# Development (local backend on your laptop)
VITE_BACKEND_URL=http://localhost:5000

# Production (after deploying to Render)
VITE_BACKEND_URL=https://mrn-football-legends.onrender.com
```

Change it based on where your backend is running.

---

## Using the API in Your Components

### 1. Login Screen (Example)

```typescript
import { loginWithBackend, saveToken } from '@/services/backendApiService';

async function handleLogin(username: string, password: string) {
  try {
    const { token, user } = await loginWithBackend(username, password);
    
    // Token is automatically saved to localStorage
    // user contains: { id, username, email, coins, gems, rank, level }
    
    console.log('Login successful:', user);
    // Navigate to main menu
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}
```

### 2. Register Screen (Example)

```typescript
import { registerWithBackend } from '@/services/backendApiService';

async function handleRegister(username: string, email: string, password: string) {
  try {
    const { token, user } = await registerWithBackend(username, email, password);
    
    console.log('Registration successful:', user);
    // Navigate to main menu
  } catch (error) {
    console.error('Registration failed:', error.message);
  }
}
```

### 3. Get Player Profile

```typescript
import { getPlayerProfile } from '@/services/backendApiService';

async function loadPlayerProfile(playerId: string) {
  try {
    const profile = await getPlayerProfile(playerId);
    
    // profile contains: { id, username, coins, gems, rank, level, wins, losses, squad }
    console.log('Player profile:', profile);
    
    // Update UI with profile data
    setPlayerData(profile);
  } catch (error) {
    console.error('Failed to load profile:', error.message);
  }
}
```

### 4. Record Match Result

```typescript
import { recordMatchResult } from '@/services/backendApiService';

async function submitMatchResult(player1Id: string, player2Id: string, score1: number, score2: number) {
  try {
    const result = await recordMatchResult(
      player1Id,
      player2Id,
      score1,
      score2,
      'ranked' // or 'friendly' or 'campaign'
    );
    
    console.log('Match recorded:', result);
    // result contains: { message, winner, loser }
    
    // Award coins/rewards based on winner
    refreshPlayerStats();
  } catch (error) {
    console.error('Failed to record match:', error.message);
  }
}
```

### 5. Get Leaderboard

```typescript
import { getLeaderboard } from '@/services/backendApiService';

async function loadLeaderboard() {
  try {
    const players = await getLeaderboard();
    
    // players is an array of: { _id, username, rank, wins, losses, level }
    console.log('Top players:', players);
    
    // Display in UI
    setLeaderboardData(players);
  } catch (error) {
    console.error('Failed to load leaderboard:', error.message);
  }
}
```

### 6. Add Coins (Rewards/Shop)

```typescript
import { addCoins } from '@/services/backendApiService';

async function awardCoins(amount: number) {
  try {
    const result = await addCoins(amount);
    
    // result contains: { message, newBalance }
    console.log('Coins added. New balance:', result.newBalance);
    
    // Update UI
    setPlayerCoins(result.newBalance);
  } catch (error) {
    console.error('Failed to add coins:', error.message);
  }
}
```

### 7. Check Backend Health

```typescript
import { checkBackendHealth } from '@/services/backendApiService';

async function verifyBackendConnection() {
  const isHealthy = await checkBackendHealth();
  
  if (isHealthy) {
    console.log('✅ Backend is connected');
  } else {
    console.log('❌ Backend is not available');
    // Show offline message or use fallback
  }
}
```

---

## Authentication Token Handling

Tokens are automatically saved and used in requests:

```typescript
import { getToken, clearToken } from '@/services/backendApiService';

// Get current token
const token = getToken(); // Returns token or null

// Clear token on logout
function handleLogout() {
  clearToken(); // Removes token from localStorage
  // Navigate to login screen
}
```

---

## Error Handling

All API functions throw errors on failure:

```typescript
try {
  const result = await loginWithBackend(username, password);
} catch (error) {
  if (error.message.includes('Invalid credentials')) {
    // Show "Wrong username or password" message
  } else if (error.message.includes('Network')) {
    // Show "No internet connection" message
  } else {
    // Show generic error
  }
}
```

---

## Common Response Formats

### Login/Register Response
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "player123",
    "email": "player@example.com",
    "coins": 5000,
    "gems": 100,
    "rank": 1,
    "level": 1
  }
}
```

### Player Profile Response
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "player123",
  "coins": 5350,
  "gems": 100,
  "rank": 45,
  "level": 12,
  "wins": 23,
  "losses": 5,
  "totalMatches": 28,
  "squad": [...]
}
```

### Match Result Response
```json
{
  "message": "Match recorded",
  "winner": "507f1f77bcf86cd799439011",
  "loser": "507f1f77bcf86cd799439012"
}
```

### Leaderboard Response
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "username": "ProPlayer",
    "rank": 2500,
    "wins": 156,
    "losses": 42,
    "level": 45
  },
  ...
]
```

---

## Step-by-Step Integration Path

1. **Update Login Component**
   - Replace Firebase login with `loginWithBackend()`
   - Test with username/password

2. **Update Register Component**
   - Replace Firebase register with `registerWithBackend()`
   - Test registration

3. **Update Profile Page**
   - Load player data with `getPlayerProfile()`
   - Display coins, rank, wins/losses

4. **Update Match End Screen**
   - Call `recordMatchResult()` when match completes
   - Update stats based on response

5. **Update Leaderboard**
   - Replace any Firestore query with `getLeaderboard()`
   - Sort by rank

6. **Update Shop/Rewards**
   - Call `addCoins()` when player purchases or earns coins

---

## Testing

Start your local backend server:

```bash
cd C:\Users\IT Engineer\Documents\MRNBackend
npm start
```

Make sure `.env.local` has:
```dotenv
VITE_BACKEND_URL=http://localhost:5000
```

Then run your game:
```bash
npm run dev
```

Test login/register to verify the connection works.

---

## Switching to Production (Render)

1. Deploy backend to Render (see [DEPLOYMENT_GUIDE.md](../MRNBackend/DEPLOYMENT_GUIDE.md))
2. Get your Render URL: `https://mrn-football-legends.onrender.com`
3. Update `.env.local`:
   ```dotenv
   VITE_BACKEND_URL=https://mrn-football-legends.onrender.com
   ```
4. Build your game:
   ```bash
   npm run build
   ```
5. Deploy game

Now all game traffic goes to your live backend! 🚀

---

## Troubleshooting

**"Not authenticated" error?**
- User hasn't logged in yet
- Token expired (need to re-login)

**"Failed to fetch" error?**
- Backend not running
- Wrong URL in `.env.local`
- CORS issue (backend should allow your domain)

**Scores not saving?**
- Token might be expired
- Player ID mismatch
- Backend validation rejecting the score

Check browser console → Network tab to see actual API responses.
