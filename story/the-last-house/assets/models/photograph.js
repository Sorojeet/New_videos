// An old photograph: aged sepia print with a white border and a handwritten date on the back.
// build({ image (Texture, e.g. a render target), date, font }) -> Group (≈ 10.5 × 13 cm)
import * as THREE from 'three';

export const SIZE = { w: 0.105, h: 0.13, border: 0.008, bottom: 0.024 };

function backTexture(date, font) {
  const c = document.createElement('canvas');
  c.width = 420; c.height = 520;
  const g = c.getContext('2d');
  g.fillStyle = '#ebe0c6'; g.fillRect(0, 0, c.width, c.height);
  let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 24; i++) {
    const x = rnd() * c.width, y = rnd() * c.height, rr = 12 + rnd() * 70;
    const gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, 'rgba(150,115,60,0.14)'); gr.addColorStop(1, 'rgba(150,115,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  }
  g.fillStyle = 'rgba(45,32,26,0.9)';
  g.font = `600 64px "${font}", cursive`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(210, 250); g.rotate(-0.07);
  const [a, b] = date.split('|');
  g.fillText(a, 0, -40); g.fillText(b, 0, 40);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function agedMaterial(image) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: image } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D map; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.7); }
      void main(){
        vec3 c = texture2D(map, vUv).rgb;
        float l = dot(c, vec3(0.3, 0.59, 0.11));
        vec3 sep = vec3(l * 1.07 + 0.05, l * 0.93 + 0.03, l * 0.72 + 0.01);
        sep = mix(sep, vec3(0.80, 0.72, 0.57), 0.15);
        sep *= mix(0.65, 1.0, smoothstep(0.8, 0.25, length(vUv - 0.5)));
        sep += step(0.996, h(vec2(floor(vUv.x * 260.0), 3.0))) * step(0.35, h(vec2(vUv.y * 5.0, vUv.x))) * 0.22;
        sep += (h(vUv * 800.0) - 0.5) * 0.05;
        gl_FragColor = vec4(clamp(sep, 0.0, 1.0), 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

export function build({ image = null, date = 'November 17|1976', font = 'Caveat' } = {}) {
  const g = new THREE.Group();
  g.name = 'photograph';
  const { w, h, border, bottom } = SIZE;
  const paper = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.0008), new THREE.MeshStandardMaterial({ color: '#ece5d2', roughness: 0.8 }));
  const iw = w - border * 2, ih = h - border - bottom;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(iw, ih), image ? agedMaterial(image) : new THREE.MeshStandardMaterial({ color: '#777' }));
  front.position.set(0, (bottom - border) / 2, 0.00045);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: backTexture(date, font), roughness: 0.9 }));
  back.rotation.y = Math.PI; back.position.z = -0.00045;
  g.add(paper, front, back);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { front, back };
  return g;
}
