# Interactive Diwali Surprise

A React + Vite website with a Three.js 3D cracker, particle burst, Diwali reveal, and two separate photo/audio experiences.

## 1. Install and run

You need Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

To create a production build:

```bash
npm run build
npm run preview
```

## 2. Add your own photos and audio

Put your files inside `public/assets/` and use these exact filenames:

| Purpose | Filename |
|---|---|
| Portrait used in the reveal and audio experiences | `main-photo.png` |
| Advice voice recording | `advice.ogg` |
| Song recording | `song.mp4` |

The uploaded cracker reference is included as `cracker-reference.jpg`. The 3D cracker is procedurally modelled in Three.js, so the reference is for visual guidance and is not displayed as a flat image.

If your files are PNG, either convert them to JPG or update the matching path in `src/App.jsx`. Ogg/Opus audio is supported by modern browsers.

## 3. Customise the message

Open `src/App.jsx` and edit the text inside the reveal screen:
- `Happy Diwali, Ravish!`
- The personal message below the photo
- The headings and button labels if required

The name is currently used in the greeting and button labels as requested.

## 4. Audio behaviour

Each audio experience starts after its button is clicked. Returning to the celebration screen stops and resets that audio. The player includes play/pause, replay, mute, and seeking.

Browsers may block autoplay in some situations. In that case, use the play button in the audio player.

## 5. Performance notes

- Three.js renders the cracker and the particle burst.
- Particle counts are reduced on smaller screens.
- Device pixel ratio is capped to reduce GPU load.
- Animation resources are disposed when the scene unmounts.
- A WebGL fallback is not included in this starter project. Devices without WebGL will not render the 3D cracker.

## 6. Important

The project uses a procedural 3D interpretation of the supplied triangular cracker reference. For a closer photorealistic match, replace the procedural model with a custom GLB/GLTF model made in Blender.
