import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Volume2, VolumeX, Play, Pause, RotateCcw, Sparkles, Music2, MessageCircleHeart } from 'lucide-react';

const ASSETS = {
  // Replace these files with your own. Keep the filenames unchanged.
  mainPhoto: '/assets/main-photo.png',
  advicePhoto: '/assets/main-photo.png',
  adviceAudio: '/assets/advice.ogg',
  songPhoto: '/assets/main-photo.png',
  songAudio: '/assets/song.mp4',
};

function CrackerScene({ onIgnite, onBurst, active }) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  const activeRef = useRef(active);
  const onIgniteRef = useRef(onIgnite);
  const onBurstRef = useRef(onBurst);

  useEffect(() => {
    activeRef.current = active;
    onIgniteRef.current = onIgnite;
    onBurstRef.current = onBurst;
  }, [active, onIgnite, onBurst]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#fffdf9');
    scene.fog = new THREE.FogExp2('#fffdf9', 0.025);

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.1, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff4e3, 1.8));
    const key = new THREE.DirectionalLight(0xffe3b2, 3.4);
    key.position.set(-3, 5, 6);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight(0xe85d32, 8, 12);
    rim.position.set(3, -1, 2);
    scene.add(rim);

    const cracker = new THREE.Group();
    scene.add(cracker);

    const shell = new THREE.Group();
    shell.rotation.y = Math.PI / 3;
    cracker.add(shell);
    const bodyGeo = new THREE.CylinderGeometry(0.2, 1.55, 1.82, 3, 1, false);
    bodyGeo.translate(0, -0.16, 0);
    const paper = new THREE.MeshStandardMaterial({ color: '#c5a475', roughness: 0.94, metalness: 0, flatShading: true });
    const body = new THREE.Mesh(bodyGeo, paper);
    body.castShadow = true;
    body.receiveShadow = true;
    shell.add(body);

    const foldMat = new THREE.MeshStandardMaterial({ color: '#e0c799', roughness: 0.88, metalness: 0 });
    const foldEdges = [];
    for (let panel = 0; panel < 3; panel++) {
      const angle = panel * Math.PI * 2 / 3;
      const top = new THREE.Vector3(Math.sin(angle) * 0.205, 0.75, Math.cos(angle) * 0.205);
      const bottom = new THREE.Vector3(Math.sin(angle) * 1.56, -1.07, Math.cos(angle) * 1.56);
      foldEdges.push(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(top, bottom), 24, 0.022, 6, false), foldMat));
    }
    foldEdges.forEach(edge => shell.add(edge));
    const bandPoints = Array.from({ length: 3 }, (_, panel) => {
      const angle = panel * Math.PI * 2 / 3;
      return new THREE.Vector3(Math.sin(angle) * 1.05, -0.48, Math.cos(angle) * 1.05);
    });
    for (let panel = 0; panel < 3; panel++) {
      const band = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(bandPoints[panel], bandPoints[(panel + 1) % 3]), 16, 0.018, 6, false), foldMat);
      shell.add(band);
    }

    // Twisted-looking fuse built from three fine braided strands.
    const fuseGroup = new THREE.Group();
    fuseGroup.position.set(0, 0.73, 0);
    fuseGroup.rotation.z = 0.23;
    cracker.add(fuseGroup);
    const fuseBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 0.3, 12), new THREE.MeshStandardMaterial({ color: '#b28e5a', roughness: 0.9 }));
    fuseBase.position.y = 0.12;
    fuseGroup.add(fuseBase);
    const burntFuse = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 10), new THREE.MeshBasicMaterial({ color: '#453329' }));
    burntFuse.visible = false;
    fuseGroup.add(burntFuse);
    const fuseMat = new THREE.MeshStandardMaterial({ color: '#655f55', roughness: 0.9 });
    for (let strand = 0; strand < 3; strand++) {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const angle = t * Math.PI * 7 + strand * Math.PI * 2 / 3;
        pts.push(new THREE.Vector3(Math.cos(angle) * 0.07, 0.25 + t * 1.2, Math.sin(angle) * 0.07));
      }
      fuseGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.025, 6, false), fuseMat));
    }
    const ember = new THREE.PointLight(0xff6a16, 3.2, 2.5);
    ember.position.set(0, 1.5, 0.1);
    fuseGroup.add(ember);
    const emberBall = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshBasicMaterial({ color: '#ff9c35' }));
    emberBall.position.copy(ember.position);
    fuseGroup.add(emberBall);

    const sparkCount = 72;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocity = Array.from({ length: sparkCount }, () => new THREE.Vector3());
    const sparkAges = new Float32Array(sparkCount);
    const sparkGeometry = new THREE.BufferGeometry();
    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparks = new THREE.Points(sparkGeometry, new THREE.PointsMaterial({ color: '#ff8b38', size: 0.075, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    fuseGroup.add(sparks);

    // Small floating festive dust.
    const dustCount = window.innerWidth < 700 ? 450 : 850;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i*3] = (Math.random() - 0.5) * 13;
      dustPositions[i*3+1] = (Math.random() - 0.5) * 9;
      dustPositions[i*3+2] = (Math.random() - 0.5) * 5;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#f4c777', size: 0.025, transparent: true, opacity: 0.72 }));
    scene.add(dust);

    // Reusable burst particles. The animation is driven in the render loop.
    const particleCount = window.innerWidth < 700 ? 650 : 1150;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const velocities = [];
    const color = new THREE.Color();
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i*3] = 0;
      particlePositions[i*3+1] = -50;
      particlePositions[i*3+2] = 0;
      color.setHSL(0.08 + Math.random() * 0.07, 0.9, 0.52 + Math.random() * 0.2);
      particleColors[i*3] = color.r;
      particleColors[i*3+1] = color.g;
      particleColors[i*3+2] = color.b;
      velocities.push(new THREE.Vector3());
    }
    const burstGeo = new THREE.BufferGeometry();
    burstGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    burstGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const burstMat = new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const burst = new THREE.Points(burstGeo, burstMat);
    scene.add(burst);

    let burning = false;
    let burnAge = 0;
    let exploded = false;
    let burstAge = 0;
    let animationId;
    let burstAudioContext;
    const clock = new THREE.Clock();
    const playBurstSound = () => {
      if (!burstAudioContext) return;
      const now = burstAudioContext.currentTime;
      const boom = burstAudioContext.createOscillator();
      const boomGain = burstAudioContext.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(145, now);
      boom.frequency.exponentialRampToValueAtTime(42, now + 0.28);
      boomGain.gain.setValueAtTime(0.38, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      boom.connect(boomGain);
      boomGain.connect(burstAudioContext.destination);
      boom.start(now);
      boom.stop(now + 0.37);

      const bufferLength = Math.floor(burstAudioContext.sampleRate * 0.32);
      const noiseBuffer = burstAudioContext.createBuffer(1, bufferLength, burstAudioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferLength; i++) noiseData[i] = (Math.random() * 2 - 1) * (1 - i / bufferLength);
      const noise = burstAudioContext.createBufferSource();
      const filter = burstAudioContext.createBiquadFilter();
      const noiseGain = burstAudioContext.createGain();
      noise.buffer = noiseBuffer;
      filter.type = 'highpass';
      filter.frequency.value = 850;
      noiseGain.gain.setValueAtTime(0.32, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(burstAudioContext.destination);
      noise.start(now);
      noise.stop(now + 0.32);
    };
    const startBurst = () => {
      if (exploded) return;
      exploded = true;
      burning = false;
      burstAge = 0;
      playBurstSound();
      cracker.visible = false;
      const pos = burstGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        pos[i*3] = 0;
        pos[i*3+1] = 2.85;
        pos[i*3+2] = 0;
        const v = new THREE.Vector3(Math.random()-0.5, Math.random()-0.35, Math.random()-0.5).normalize();
        const speed = 2.0 + Math.random() * 5.8;
        velocities[i].copy(v.multiplyScalar(speed));
      }
      burstGeo.attributes.position.needsUpdate = true;
      burstMat.opacity = 1;
      onBurstRef.current?.();
    };
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    apiRef.current = { startBurn() { if (!burning && !exploded) { burning = true; burnAge = 0; } } };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.033);
      const elapsed = clock.elapsedTime;
      cracker.rotation.y = Math.sin(elapsed * 0.45) * 0.13;
      cracker.rotation.x = Math.sin(elapsed * 0.55) * 0.035;
      cracker.position.y = Math.sin(elapsed * 1.1) * 0.08;
      ember.intensity = (burning ? 5 : 2.4) + Math.sin(elapsed * 15) * 0.8;
      if (burning) {
        burnAge += delta;
        const progress = Math.min(burnAge / 1.9, 1);
        ember.position.y = 1.5 - progress * 1.2;
        emberBall.position.copy(ember.position);
        burntFuse.visible = true;
        burntFuse.scale.y = progress;
        burntFuse.position.y = 1.5 - progress * 0.6;
        sparks.material.opacity = 0.9;
        const sparkPos = sparkGeometry.attributes.position.array;
        for (let i = 0; i < sparkCount; i++) {
          const j = i * 3;
          sparkAges[i] -= delta;
          if (sparkAges[i] <= 0) {
            sparkAges[i] = 0.18 + Math.random() * 0.55;
            sparkPos[j] = ember.position.x;
            sparkPos[j + 1] = ember.position.y;
            sparkPos[j + 2] = ember.position.z;
            sparkVelocity[i].set((Math.random() - 0.5) * 3.4, Math.random() * 2.8, (Math.random() - 0.5) * 2.2);
          } else {
            sparkPos[j] += sparkVelocity[i].x * delta;
            sparkPos[j + 1] += sparkVelocity[i].y * delta;
            sparkPos[j + 2] += sparkVelocity[i].z * delta;
            sparkVelocity[i].y -= 4.5 * delta;
          }
        }
        sparkGeometry.attributes.position.needsUpdate = true;
        if (progress === 1) startBurst();
      }
      dust.rotation.y += delta * 0.012;
      if (exploded) {
        burstAge += delta;
        const pos = burstGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const j = i * 3;
          pos[j] += velocities[i].x * delta;
          pos[j+1] += velocities[i].y * delta;
          pos[j+2] += velocities[i].z * delta;
          velocities[i].y -= 1.9 * delta;
          velocities[i].multiplyScalar(0.997);
        }
        burstGeo.attributes.position.needsUpdate = true;
        burstMat.opacity = Math.max(0, 1 - burstAge / 2.8);
        if (burstAge > 3.2) burst.visible = false;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleClick = () => {
      if (activeRef.current || exploded) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!burstAudioContext && AudioContext) burstAudioContext = new AudioContext();
      burstAudioContext?.resume().catch(() => {});
      onIgniteRef.current();
    };
    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      renderer.domElement.removeEventListener('click', handleClick);
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => m.dispose());
        }
      });
      renderer.dispose();
      burstAudioContext?.close().catch(() => {});
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (active && apiRef.current) apiRef.current.startBurn();
  }, [active]);

  return <div className="three-stage" ref={mountRef} aria-label="Interactive 3D Diwali cracker" />;
}

function Photo({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`photo-frame ${className}`}>
      {!failed ? <img src={src} alt={alt} onError={() => setFailed(true)} /> :
        <div className="photo-placeholder"><span>YOUR PHOTO</span><small>Replace the image in public/assets</small></div>}
    </div>
  );
}

function AudioExperience({ type, onBack, muted, setMuted }) {
  const isAdvice = type === 'advice';
  const photo = isAdvice ? ASSETS.advicePhoto : ASSETS.songPhoto;
  const audioSrc = isAdvice ? ASSETS.adviceAudio : ASSETS.songAudio;
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    const update = () => {
      setProgress(audio.currentTime || 0);
      setDuration(audio.duration || 0);
    };
    const ended = () => setPlaying(false);
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('ended', ended);
    audio.play().then(() => setPlaying(true)).catch(() => {});
    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('loadedmetadata', update);
      audio.removeEventListener('ended', ended);
    };
  }, [audioSrc]);

  useEffect(() => { if (audioRef.current) audioRef.current.muted = muted; }, [muted]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); } catch {}
    } else { audio.pause(); setPlaying(false); }
  };
  const replay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  };
  const seek = e => {
    if (audioRef.current && duration) audioRef.current.currentTime = Number(e.target.value) * duration / 100;
  };
  const fmt = n => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;

  return (
    <main className="experience-screen">
      <audio ref={audioRef} src={audioSrc} preload="auto" />
      <button className="back-button" onClick={onBack}><ArrowLeft size={17}/> Back to celebration</button>
      <div className="experience-content">
        <h1>{isAdvice ? 'A Little Advice for You' : 'A Song Just for You'}</h1>
        <p className="experience-subtitle">{isAdvice ? 'A few words worth keeping.' : 'A little music to make the moment brighter.'}</p>
        <Photo src={photo} alt="Ravish" className="experience-photo" />
        <div className="audio-card">
          <div className="audio-title">
            <span className="audio-icon">{isAdvice ? <MessageCircleHeart size={19}/> : <Music2 size={19}/>}</span>
            <div><strong>{isAdvice ? 'Advice recording' : 'Song recording'}</strong><small>{playing ? 'Now playing' : 'Audio experience'}</small></div>
            <div className={`playing-bars ${playing ? 'is-playing' : ''}`}><i/><i/><i/><i/></div>
          </div>
          <input className="seek" aria-label="Audio progress" type="range" min="0" max="100" value={duration ? progress / duration * 100 : 0} onChange={seek}/>
          <div className="time-row"><span>{fmt(progress)}</span><span>{fmt(duration)}</span></div>
          <div className="audio-controls">
            <button className="round-control" onClick={replay} aria-label="Replay"><RotateCcw size={18}/></button>
            <button className="play-control" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={21} fill="currentColor"/> : <Play size={21} fill="currentColor"/>}</button>
            <button className="round-control" onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [stage, setStage] = useState('cracker');
  const [exploding, setExploding] = useState(false);
  const [tipPhotoVisible, setTipPhotoVisible] = useState(false);
  const [muted, setMuted] = useState(false);
  const [popKey, setPopKey] = useState(0);
  const timerRef = useRef(null);

  const ignite = useCallback(() => {
    if (exploding || stage !== 'cracker') return;
    setExploding(true);
    timerRef.current = window.setTimeout(() => setStage('reveal'), 3550);
  }, [exploding, stage]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const popGreeting = () => setPopKey(k => k + 1);
  const goBack = () => setStage('reveal');

  return (
    <div className="app-shell">
      <div className="ambient-glow" />

      {stage === 'cracker' && (
        <main className="hero-screen">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> A FESTIVE SURPRISE</div>
            <h1>Something special<br/><em>is waiting for you.</em></h1>
            <p>One little spark, one big surprise.</p>
          </div>
          <div className="cracker-wrap">
            <CrackerScene active={exploding} onIgnite={ignite} onBurst={() => setTipPhotoVisible(true)}/>
            {tipPhotoVisible && <Photo src={ASSETS.mainPhoto} alt="Your friend" className="tip-photo"/>}
            {!exploding && <div className="click-hint"><span className="hint-ring"><Sparkles size={16}/></span> Click the cracker to reveal your surprise</div>}
            {exploding && <div className="ignition-label">LIGHTING THE SPARK...</div>}
          </div>
          <div className="hero-footer"><span>LIGHT • JOY • TOGETHERNESS</span><span>HAPPY DIWALI</span></div>
        </main>
      )}

      {stage === 'reveal' && (
        <main className="reveal-screen">
          <div className="reveal-fireworks" aria-hidden="true"><span/><span/><span/><span/><span/><span/></div>
          <div className="confetti-poppers" aria-hidden="true">
            {Array.from({ length: 48 }, (_, particleIndex) => {
              const edge = particleIndex % 4;
              const offset = `${10 + (particleIndex * 29) % 80}%`;
              const travel = 25 + (particleIndex * 17) % 35;
              const verticalDrift = `${(particleIndex % 5 - 2) * 5}vh`;
              const horizontalDrift = `${(particleIndex % 5 - 2) * 5}vw`;
              const startX = edge === 0 ? '-2%' : edge === 1 ? '102%' : offset;
              const startY = edge === 2 ? '-3%' : edge === 3 ? '103%' : offset;
              const driftX = edge === 0 ? `${travel}vw` : edge === 1 ? `-${travel}vw` : horizontalDrift;
              const driftY = edge === 2 ? `${travel + 25}vh` : edge === 3 ? `-${travel + 25}vh` : verticalDrift;
              const colors = ['#d65b45', '#e1ae42', '#668d68', '#5686a7', '#cf7183', '#f0d071'];
              return <i key={particleIndex} style={{ '--start-x': startX, '--start-y': startY, '--drift-x': driftX, '--drift-y': driftY, '--turn': `${particleIndex % 2 ? 540 : -540}deg`, '--delay': `${particleIndex % 8 * 0.035}s`, '--confetti-color': colors[particleIndex % colors.length] }} />;
            })}
          </div>
          <div className="reveal-content">
            <h1 className="happy-title" key={popKey} onClick={popGreeting} role="button" tabIndex="0" onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && popGreeting()}>
              HAPPY <span>DIWALI!</span>
            </h1>
            <p className="tap-hint">Tap the greeting for a little Diwali pop ✨</p>
            <Photo src={ASSETS.mainPhoto} alt="Ravish" className="main-photo"/>
            <p className="personal-message">Wishing you a festival filled with light, laughter and unforgettable moments.</p>
            <div className="choice-heading">MAKE A LITTLE MORE MAGIC</div>
            <div className="choice-grid">
              <button className="choice-card" onClick={() => setStage('advice')}>
                <span className="choice-icon"><MessageCircleHeart size={23}/></span>
                <span className="choice-label">Get Advice from Ravish</span>
                <span className="choice-desc">A message worth listening to</span>
                <span className="choice-arrow">↗</span>
              </button>
              <button className="choice-card" onClick={() => setStage('song')}>
                <span className="choice-icon"><Music2 size={23}/></span>
                <span className="choice-label">Hear a Song from Ravish</span>
                <span className="choice-desc">Press play and enjoy the moment</span>
                <span className="choice-arrow">↗</span>
              </button>
            </div>
          </div>
          {popKey > 0 && <div className="pop-flash" key={`flash-${popKey}`} />}
        </main>
      )}

      {(stage === 'advice' || stage === 'song') && (
        <AudioExperience type={stage} onBack={goBack} muted={muted} setMuted={setMuted}/>
      )}
      <div className="bottom-note">MADE WITH A LITTLE EXTRA SPARK ✦</div>
    </div>
  );
}
