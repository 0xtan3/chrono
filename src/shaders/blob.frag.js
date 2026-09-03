export const blobFrag = /* glsl */`
precision highp float;

uniform float u_time;
uniform float u_fill;       // 0.0–1.0
uniform vec3  u_colorA;     // base energy color
uniform vec3  u_colorB;     // bright energy color
uniform vec3  u_darkColor;  // empty shell color
uniform vec3  u_rimColor;   // shell rim glow

varying vec3  v_pos;
varying vec3  v_normal;
varying float v_fill_factor;

// Simple 3D value noise for plasma effect
float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

void main(){
  // Fresnel glass reflection factor
  vec3 viewDir = vec3(0., 0., 1.);
  float rim = 1.0 - abs(dot(normalize(v_normal), viewDir));
  float fresnel = pow(rim, 2.2);

  // Create a dynamic, swirling energy noise field
  float n1 = noise(v_pos * 3.5 + vec3(0.0, -u_time * 1.2, u_time * 0.4));
  float n2 = noise(v_pos * 6.0 + vec3(u_time * 1.8, u_time * 0.8, 0.0));
  float energyMap = (n1 * 0.65 + n2 * 0.35);

  // The fill boundary perturbed by the energy map, creating a plasma dissolve edge
  // instead of a flat liquid wave
  float boundary = u_fill + (energyMap - 0.5) * 0.25;

  if(v_fill_factor < boundary){
    // ══ ACTIVE ENERGY CORE ══════════════════════════════════════════
    // Mix colors based on the energy map to give it a swirling plasma look
    vec3 color = mix(u_colorA, u_colorB, energyMap * 1.3);

    // Add a hot glowing edge right where the materialization boundary is
    float distToBoundary = boundary - v_fill_factor;
    float hotEdge = 1.0 - smoothstep(0.0, 0.06, distToBoundary);
    
    // Add pulsing intensity to the edge
    color += u_colorB * hotEdge * (1.2 + sin(u_time * 10.0) * 0.4);

    // Rim lighting
    color += fresnel * u_rimColor * 0.5;

    gl_FragColor = vec4(color, 0.96);

  } else {
    // ══ DORMANT SHELL ═══════════════════════════════════════════════
    vec3 color = u_darkColor + fresnel * u_rimColor * 0.45;

    // Soft ambient plasma glow bleeding past the boundary
    float distToBoundary = v_fill_factor - boundary;
    float bleedGlow = 1.0 - smoothstep(0.0, 0.18, distToBoundary);
    color += mix(u_colorA, u_colorB, 0.5) * bleedGlow * 0.45;

    gl_FragColor = vec4(color, 0.88);
  }
}
`;
