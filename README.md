# 🌌 VECTOR VOID — Retro Arcade Vector Remake

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural_Web_Audio_API-brightgreen)](#-procedural-web-audio-api-sound-synthesizer)
[![Physics](https://img.shields.io/badge/Physics-Frame--Rate_Independent-orange)](#-frame-rate-independent-physics-engine)
[![Tests](https://img.shields.io/badge/Tests-15%2F15_Passing-success)](#-unit-testing--verification)

> **Vector Void** is a high-fidelity, modern reimagining of the legendary 1979 vector arcade classic *Asteroids*. Engineered from the ground up with decoupled physics, procedural Web Audio API synthesis, zero-garbage-collection particle dynamics, magnetic collectible power-ups, intelligent enemy saucer AI, and persistent retro arcade cabinet leaderboards.

---

## 📸 Screenshots & Showcase

| Attract Mode Title Screen | High-Octane Sector Action |
|:---:|:---:|
| Glowing vector emblem, CRT scanlines, and live background autopilot simulation | Toroidal wrapping, colorful particle bursts, active combo multipliers, and magnetic power-up drops |

---

## ⚡ Core Highlights & Engineering Architecture

### 🚀 Frame-Rate Independent Physics Engine
- **Toroidal Topology (Screen Wrapping)**: Complete seamless 2D wrap-around across screen boundaries for all entities (player ship, asteroid fragments, laser beams, enemy saucers, supply crates, and particle trails).
- **Newtonian Inertial Dynamics**: True vector momentum with rotational torque, directional thrust impulse, and realistic quadratic drag ($v_{t+1} = v_t \cdot \mu^{\Delta t \cdot 60}$), preventing tunneling or teleportation across varying display refresh rates (60Hz, 120Hz, 144Hz).
- **Decoupled Math & Fast Collisions**: Microsecond-fast Circle-Circle intersection tests ($d^2 \le (r_1 + r_2)^2$) and Circle-to-AABB bounding calculations with 100% pure unit test coverage.
- **Screen Shake & Hitstop Feedback**: Traumatic polynomial camera recoil ($\text{shake} = \text{trauma}^2 \times \text{amplitude}$) with short $0.04\text{s}$ simulation freeze frames on massive impacts for satisfying tactile crunch.

### 🔊 Procedural Web Audio API Sound Synthesizer
*Zero external audio MP3/WAV files, zero network asset latency, and 100% synthesized in real time via native Web Audio oscillators, noise buffers, and biquad filters:*
- **Adaptive Heartbeat Pulse**: Alternating low/high sub-bass thumps ($80\text{ Hz} \leftrightarrow 100\text{ Hz}$) that dynamically accelerate as fewer asteroids remain in the sector.
- **Frequency-Modulated Laser Cannons**: Sweeping pitch glides with micro-randomized transients for standard lasers, high-cadence rapid pulses, and saw-tooth spread bursts.
- **Multi-Band Noise Explosions**: Procedurally generated white noise buffers passed through dynamic low-pass and band-pass filters tailored for small cracks, crunchy medium rocks, deep rumbling asteroid cores, and catastrophic player ship ruptures.
- **Hostile UFO Theremin Warble**: Dual-oscillator FM synthesis featuring an LFO triangle modulator producing the iconic sci-fi warble.
- **Harmonic Fanfares & Glides**: Ascending A-Major arpeggiated chimes for power-up pickups and sweeping frequency flangers for hyperspace warp jumps.

### 💥 Zero-GC Multi-Chromatic Particle System
- **Pre-Allocated Ring Buffer**: A fixed-capacity 950-particle pool pre-allocated into memory at boot time. Zero object creation or garbage-collection spikes inside `requestAnimationFrame`.
- **Spectacular Neon Detonations**: Destroying an asteroid with player laser fire or EMP triggers an explosion of electric cyan (`#06b6d4`), blazing magenta (`#ec4899`), sunburst amber (`#fbbf24`), emerald (`#10b981`), and ultraviolet (`#c084fc`) particles.
- **Diverse Particle Forms**: Directional high-speed velocity streak lines, tumbling vector crystal shards, floating spark embers, and expanding shockwave rings.
- **Aerodynamic Easing & Decay**: Particles decelerate naturally using frame-rate independent drag and fade out smoothly via linear alpha interpolation before being recycled.

### 🔋 Power-Up Spawning & Temporary Buffs
- **Dynamic Drop Algorithm**: Drop odds scale organically based on asteroid size and current combo streaks (8% for small rocks, up to 22%+ for massive asteroids), with guaranteed drops upon destroying hostile flying saucers.
- **Periodic Sector Supply Beacons**: Automated supply drops drift into the combat zone every 22–30 seconds with an audio-visual proximity beacon.
- **Magnetic Attraction Physics**: Collectibles within 90px smoothly accelerate and pull toward the player's ship.
- **Temporary Buff Roster**:
  - ⚡ **Rapid Vulcan (`RF`)**: 12-second hyper-cadence vulcan cannon boosting firing rate by over 2.2× ($0.08\text{s}$ cooldown) with elevated projectile speed ($720\text{ px/s}$).
  - 🛡️ **Shield Regeneration (`SR`)**: Instantly restores $+25$ Shield HP, initiates a 10-second continuous repair loop ($25\text{ HP/s}$), and wraps the ship in a pulsing emerald nano-aura.
  - 🔱 **3-Way Spread Laser (`3X`)**: 12-second multi-angle spread burst covering wide tactical arcs.
  - 💣 **EMP Shockwave (`EMP`)**: Screen-clearing energy blast vaporizing nearby asteroids and neutralizing enemy saucers.
- **Real-Time HUD Telemetry**: Dedicated color-coded progress bars and countdown timers displayed directly in the top HUD.

### 🛸 Hostile Saucer AI
- **Big Saucer (Sector Patrol)**: Drifts with sinusoidal vertical oscillation, firing erratic retaliatory lasers.
- **Small Saucer (Hunter-Killer)**: High-speed agile craft equipped with **predictive velocity aiming**—calculates player trajectory and leads its shots ahead of your flight path.

### 🕹️ Arcade Cabinet Aesthetics & Persistence
- **Live Attract Mode**: Title screen features an autonomous autopilot ship navigating and shooting drifting vector asteroids in the background.
- **CRT Scanline & Phosphor Vignette**: Authentic toggleable CRT scanline simulation and radial screen curvature.
- **Hall of Fame Leaderboard**: Persistent Top 5 high-score table saved to `localStorage` complete with retro 3-character pilot callsign initials entry.
- **Universal Controls**: Full keyboard controls for desktop and on-screen dual-pad virtual touch controls for mobile and tablet devices.

---

## 🎮 Flight Controls

| Action | Desktop Keyboard | Mobile / Tablet Touch |
|:---|:---|:---|
| **Rotate Ship** | `[A]` / `[D]` or `[←]` / `[→]` | Left / Right Steering Pad |
| **Engine Thrust** | `[W]` or `[↑]` | Flame Button |
| **Fire Lasers** | `[Space]` or `[J]` | Crosshair Button |
| **Hyperspace Warp** | `[S]` / `[↓]` or `[K]` | Sparkle Button |
| **Pause / Resume** | `[P]` or `[Escape]` | HUD Pause Button |
| **Restart Sector** | `[R]` | Pause / Game Over Menu |
| **Audio Mute** | `[M]` | HUD Sound Button |
| **Toggle CRT Scanlines** | Bottom-right Screen Button | Bottom-right Toggle |

> 💡 **Autostart Mode**: Append `?autostart=1` to the URL to instantly bypass the title screen directly into sector combat.

---

## 🗂️ Project Structure

```text
├── src/
│   ├── components/
│   │   ├── ArcadeCabinet.tsx    # Visual cabinet bezel & responsive frame
│   │   ├── ArcadeHUD.tsx        # Top perimeter HUD, active buff meters, lives & shields
│   │   ├── GameOverModal.tsx    # Telemetry recap & 3-letter high-score initials entry
│   │   ├── PauseModal.tsx       # Flight suspension & cabinet options
│   │   ├── TitleOverlay.tsx     # Vector SVG emblem, attract mode banner & flight manual
│   │   └── TouchControls.tsx    # On-screen dual-pad touch buttons for mobile
│   ├── game/
│   │   ├── audio.ts             # Web Audio API procedural sound synthesizer
│   │   ├── engine.ts            # Master game loop, entity lifecycle & canvas renderer
│   │   ├── particles.ts         # Zero-GC 950-particle ring buffer & neon emitters
│   │   ├── particles.test.ts    # Unit tests for particle drag, lifetime & pooling
│   │   ├── physics.ts           # Pure collision detection & toroidal coordinate math
│   │   ├── physics.test.ts      # Unit tests for distances, collisions & wrap boundaries
│   │   ├── rules.ts             # Scoring, combo multipliers, splits & drop math
│   │   ├── rules.test.ts        # Unit tests for scoring, wave scaling & power-up odds
│   │   ├── storage.ts           # LocalStorage high-score & cabinet settings persistence
│   │   └── types.ts             # TypeScript entity interfaces, buffs & game states
│   ├── App.tsx                  # Root React application & event bus orchestrator
│   ├── index.css                # Tailwind CSS v4 imports, scanlines & neon text glows
│   └── main.tsx                 # DOM mount entry point
├── index.html                   # HTML entry point with metadata & retro typography
├── package.json                 # Dependencies, scripts & build configuration
├── tsconfig.json                # Strict TypeScript configuration
└── vite.config.ts               # Vite bundler configuration
```

---

## 🧪 Unit Testing & Verification

The project includes pure logic test suites running natively via Node.js test runner (`node:test` and `node:assert/strict`) with zero external test framework bloat:

```bash
# Execute the full unit test suite
npm test
```

### Verified Test Suites:
- `src/game/physics.test.ts`: Validates Euclidean distance calculations, Circle-Circle intersection boundaries, Circle-AABB penetration, toroidal wrap cycling, clamping, and interpolation.
- `src/game/rules.test.ts`: Validates combo multiplier decay, asteroid splitting logic, wave scaling difficulty, leaderboard insertion, and power-up drop probability curves.
- `src/game/particles.test.ts`: Validates ring-buffer allocation, multi-chromatic particle emission, delta-time aerodynamic drag decay, and automatic particle retirement.

---

## 🛠️ Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** / **yarn** / **pnpm**

### Step-by-Step

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/vector-void.git
   cd vector-void
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

4. **Run Unit Tests**:
   ```bash
   npm test
   ```

5. **Typecheck & Lint**:
   ```bash
   npm run lint
   ```

6. **Build for Production**:
   ```bash
   npm run build
   ```
   The compiled, minified bundle will be generated in the `dist/` directory.

---

## 📐 Mathematical & Physics Formulations

### 1. Toroidal Screen Wrap
Coordinates wrap smoothly with a boundary margin $M$ matching entity radius $R$:
$$\text{wrap}(x, W, M) = \begin{cases} 
W + M & \text{if } x < -M \\
-M & \text{if } x > W + M \\
x & \text{otherwise}
\end{cases}$$

### 2. Aerodynamic Inertial Drag
Frame-rate independent velocity decay:
$$\mathbf{v}_{t+\Delta t} = \mathbf{v}_t \cdot \mu^{\Delta t \cdot 60} \quad \text{where } \mu = 0.985$$

### 3. Particle Drag Deceleration
Explosion particles decelerate with high damping:
$$\mathbf{v}_{\text{particle}} \leftarrow \mathbf{v}_{\text{particle}} \cdot (0.965)^{\Delta t \cdot 60}$$

### 4. Combo Streak Multiplier
Chaining kills within window $\tau = 2.4\text{s}$:
$$\text{Multiplier} = \min(5, \lfloor 1 + \text{Streak} \rfloor), \quad \text{Score} = \text{BasePoints} \times \text{Multiplier}$$

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

---

*Crafted with pure math, vectors, and neon phosphors.* 🕹️
