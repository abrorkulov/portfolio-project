/**
 * Everything is shaded per pixel by casting a ray at an actual sphere. There is
 * no geometry and so no polygon edge to find, however close the camera gets.
 *
 * All lighting comes out in linear HDR and the composite pass does the tone
 * mapping, so the Sun can be thousands of times brighter than a lit cloud and
 * the bloom falls off the way a real lens does.
 */

export const FULLSCREEN = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const RAY = `
uniform vec2 uRes;
uniform vec3 uF;
uniform vec3 uR;
uniform vec3 uU;
uniform vec2 uShift;
uniform float uTan;
vec3 viewRay() {
  vec2 ndc = gl_FragCoord.xy / uRes * 2.0 - 1.0 - uShift;
  return normalize(uF + uR * ndc.x * uTan * (uRes.x / uRes.y) + uU * ndc.y * uTan);
}`

const NOISE = `
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x),
        mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
        mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return s;
}`

/**
 * Longitude wraps from 1 to 0 across one meridian, and derivatives are garbage at
 * a disc's edge, where a neighbouring pixel missed the sphere. Either one makes
 * the GPU pick a wild mip: a seam pole to pole and a dotted line around the limb.
 * So nothing here uses derivatives. The mip level is worked out from how big a
 * pixel is on the surface, which the ray already knows.
 */
const SPHERE_UV = `
vec2 sphereUV(vec3 n) {
  return vec2(atan(n.y, n.x) / 6.28318530718 + 0.5, 0.5 - asin(clamp(n.z, -1.0, 1.0)) / 3.14159265359);
}
float mapLod(sampler2D map, float footprint) {
  return max(0.0, log2(max(float(textureSize(map, 0).x) * footprint / 6.28318530718, 1e-4)));
}`

export const SKY = `#version 300 es
precision highp float;
${RAY}
uniform sampler2D uMap;
uniform mat3 uGal;
uniform float uSky;
uniform float uReady;
out vec4 color;
${SPHERE_UV}
${NOISE}
void main() {
  vec3 d = viewRay();
  vec3 g = uGal * d;
  // The panorama is in galactic coordinates with longitude running left and south at
  // the top, so its core, Rift and Magellanic Clouds land where they are in the sky.
  vec3 glow = uReady > 0.5 ? pow(texture(uMap, sphereUV(vec3(g.x, -g.y, -g.z))).rgb, vec3(2.2)) : vec3(0.0);
  float lum = dot(glow, vec3(0.33));
  vec3 c = vec3(0.0);
  if (lum > 0.0004) {
    // The panorama had its stars removed, which also took its finest structure. Dust
    // and star clouds put back what a long exposure would show at this scale.
    float dust = fbm(g * 11.0 + fbm(g * 4.0) * 2.0);
    float grain = vnoise(g * 90.0);
    vec3 cool = vec3(0.62, 0.74, 1.0);
    vec3 warm = vec3(1.0, 0.8, 0.6);
    // Warm toward the old stars of the core, cool everywhere else, including the
    // Magellanic Clouds, which are bright but young.
    vec3 tint = mix(cool, warm, smoothstep(0.02, 0.5, sqrt(lum)) * smoothstep(0.3, 0.92, g.x));
    // Soft-clipped: with its stars removed, the brightest cloud is a featureless smudge.
    float soft = lum / (1.0 + lum * 6.0);
    c = tint * soft * (0.12 + dust * dust * 2.6) * (0.75 + grain * 0.5) * 0.62;
  }
  // Never quite black: a real exposure of empty sky still has a floor.
  color = vec4((c + vec3(0.0011, 0.0013, 0.002)) * uSky, 1.0);
}`

export const STAR_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec3 aDir;
layout(location = 2) in vec3 aColor;
layout(location = 3) in float aEnergy;
uniform vec2 uRes;
uniform vec3 uF;
uniform vec3 uR;
uniform vec3 uU;
uniform vec2 uShift;
uniform float uTan;
uniform float uWarp;
uniform float uDpr;
out vec2 vUv;
out vec3 vColor;
out float vCore;
out float vSpike;
void main() {
  float z = dot(aDir, uF);
  float aspect = uRes.x / uRes.y;
  if (z <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    vUv = aCorner;
    vColor = vec3(0.0);
    vCore = 1.0;
    vSpike = 0.0;
    return;
  }
  vec2 ndc = vec2(dot(aDir, uR) / (z * uTan * aspect), dot(aDir, uU) / (z * uTan));
  vec2 radial = ndc * vec2(aspect, 1.0);
  float r = length(radial);
  vec2 dir = r > 1e-4 ? radial / r : vec2(1.0, 0.0);
  vec2 perp = vec2(-dir.y, dir.x);

  // A real star is a point: what you see is the lens's blur, the same shape at every
  // brightness and just more of it. So the core barely grows, and the quad grows to
  // leave room for the halo and the diffraction spikes of the bright ones.
  float e = aEnergy;
  float corePx = (0.72 + 0.62 * pow(min(e, 8.0), 0.42)) * uDpr;
  float spike = smoothstep(1.1, 3.4, e);
  float quadPx = corePx * mix(2.4, 11.0, smoothstep(0.35, 2.6, e));
  float size = quadPx / uRes.y * 2.0;
  float stretch = uWarp * (0.008 + r * 0.17) * (0.3 + min(e, 1.0));
  vec2 offset = dir * aCorner.x * (size + stretch) + perp * aCorner.y * size;
  gl_Position = vec4(ndc + uShift + offset / vec2(aspect, 1.0), 0.0, 1.0);
  vUv = aCorner;
  vCore = corePx / quadPx;
  vSpike = spike * (1.0 - smoothstep(0.0, 0.25, uWarp));
  vColor = aColor / (1.0 + stretch * 7.0);
}`

export const STAR_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vColor;
in float vCore;
in float vSpike;
uniform float uSky;
out vec4 color;
void main() {
  float d = length(vUv);
  if (d > 1.0) discard;
  float fade = (1.0 - d) * (1.0 - d);
  float core = exp(-(d * d) / (vCore * vCore * 0.5));
  float halo = exp(-d / (vCore * 2.6)) * 0.07;
  float a = core + halo * fade;
  if (vSpike > 0.001) {
    vec2 q = vec2(0.94 * vUv.x + 0.34 * vUv.y, -0.34 * vUv.x + 0.94 * vUv.y);
    float s = exp(-abs(q.y) / (vCore * 0.16)) * exp(-abs(q.x) * 4.6) +
      exp(-abs(q.x) / (vCore * 0.16)) * exp(-abs(q.y) * 4.6);
    a += s * 0.2 * vSpike * fade;
  }
  color = vec4(vColor * a * uSky, 0.0);
}`

export const SUN = `#version 300 es
precision highp float;
${RAY}
uniform vec3 uSun;
uniform float uAngular;
uniform float uPower;
out vec4 color;
void main() {
  vec3 d = viewRay();
  float ang = acos(clamp(dot(d, uSun), -1.0, 1.0));
  float a = max(uAngular, 0.0012);
  float disc = smoothstep(a * 1.04, a * 0.96, ang);
  float corona = pow(a / max(ang, a), 2.4);
  float wide = pow(a / max(ang, a), 1.05) * 0.006;
  // Fine rays in the glare, as a camera's aperture draws them.
  vec3 side = normalize(d - uSun * dot(d, uSun) + 1e-5);
  float th = atan(dot(side, uR), dot(side, uU));
  float rays = 0.72 + 0.28 * sin(th * 14.0 + 1.3) * sin(th * 23.0 + 0.4);
  vec3 warm = vec3(1.0, 0.93, 0.82);
  vec3 c = warm * (disc * 90.0 + corona * 2.2 * rays) + vec3(1.0, 0.88, 0.72) * wide * rays;
  color = vec4(c * uPower, 0.0);
}`

/** Single scattering through a real exponential atmosphere, marched per pixel. */
export const EARTH = `#version 300 es
precision highp float;
${RAY}
uniform vec3 uC;
uniform float uRadius;
uniform vec3 uSun;
uniform mat3 uM;
uniform mat3 uCloudM;
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uClouds;
uniform float uPixel;
uniform float uLit;
uniform float uReady;
out vec4 color;
${SPHERE_UV}

#ifndef VIEW_STEPS
#define VIEW_STEPS 10
#endif
#define SUN_STEPS 3

// Unit-radius planet. The real shell is so thin it cannot be seen at this scale,
// so it is thickened about threefold, with the coefficients scaled down to match
// so the sky keeps its true colour and optical depth.
const float ATM = 1.034;
const float HR = 0.0040;
const float HM = 0.0007;
const vec3 BETA_R = vec3(11.6, 27.2, 66.2);
const float BETA_M = 14.0;
const float SUN_I = 13.0;

vec2 shell(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd);
  // From the cross product, not b*b - |ro|^2: subtracting two huge squares at
  // float precision makes a distant planet shimmer.
  vec3 cr = cross(ro, rd);
  float h = r * r - dot(cr, cr);
  if (h < 0.0) return vec2(1e9, -1e9);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}

vec3 sunTransmittance(vec3 p) {
  vec2 ex = shell(p, uSun, ATM);
  float dt = max(ex.y, 0.0) / float(SUN_STEPS);
  float r = 0.0, m = 0.0;
  for (int i = 0; i < SUN_STEPS; i++) {
    vec3 q = p + uSun * (float(i) + 0.5) * dt;
    float h = max(length(q) - 1.0, 0.0);
    r += exp(-h / HR);
    m += exp(-h / HM);
  }
  return exp(-(BETA_R * r + BETA_M * 1.1 * m) * dt);
}

void main() {
  vec3 rd = viewRay();
  vec3 ro = -uC / uRadius;
  vec2 at = shell(ro, rd, ATM);
  if (at.y < 0.0 || at.x > at.y) { color = vec4(0.0); return; }
  vec2 g = shell(ro, rd, 1.0);
  bool hit = g.x < g.y && g.x > 0.0;
  float t0 = max(at.x, 0.0);
  float t1 = hit ? g.x : at.y;

  // In-scatter along the view ray.
  float dt = (t1 - t0) / float(VIEW_STEPS);
  float odR = 0.0, odM = 0.0;
  vec3 sumR = vec3(0.0), sumM = vec3(0.0);
  for (int i = 0; i < VIEW_STEPS; i++) {
    vec3 p = ro + rd * (t0 + (float(i) + 0.5) * dt);
    float h = max(length(p) - 1.0, 0.0);
    float dR = exp(-h / HR) * dt;
    float dM = exp(-h / HM) * dt;
    odR += dR;
    odM += dM;
    // In the planet's shadow nothing scatters. A soft edge stands in for the
    // penumbra and for the light that wraps around the limb at dusk.
    vec2 sh = shell(p, uSun, 1.0);
    float shadow = sh.x > 0.0 && sh.x < sh.y ? 0.0 : 1.0;
    if (shadow > 0.0) {
      vec3 tr = sunTransmittance(p) * exp(-(BETA_R * odR + BETA_M * 1.1 * odM));
      sumR += tr * dR;
      sumM += tr * dM;
    }
  }
  float mu = dot(rd, uSun);
  float phaseR = 0.0597 * (1.0 + mu * mu);
  const float gm = 0.76;
  float phaseM = 0.1194 * (1.0 - gm * gm) * (1.0 + mu * mu)
    / ((2.0 + gm * gm) * pow(max(1.0 + gm * gm - 2.0 * gm * mu, 1e-3), 1.5));
  vec3 inscatter = (sumR * BETA_R * phaseR + sumM * BETA_M * phaseM) * SUN_I;
  vec3 viewT = exp(-(BETA_R * odR + BETA_M * 1.1 * odM));

  if (!hit) {
    float a = 1.0 - dot(viewT, vec3(0.3333));
    color = vec4(inscatter * uLit, clamp(a, 0.0, 1.0));
    return;
  }

  vec3 p = normalize(ro + rd * g.x);
  vec3 nB = uM * p;
  vec2 uv = sphereUV(nB);
  // A pixel's footprint on the surface grows with distance and with grazing angle.
  float footprint = uPixel * g.x / max(dot(p, -rd), 0.12);
  vec3 day = uReady > 0.5 ? pow(textureLod(uDay, uv, mapLod(uDay, footprint)).rgb, vec3(2.2)) : vec3(0.02, 0.04, 0.09);
  vec3 lights = uReady > 0.5 ? pow(textureLod(uNight, uv, mapLod(uNight, footprint)).rgb, vec3(2.2)) : vec3(0.0);

  vec3 nC = uCloudM * p;
  vec2 cuv = sphereUV(nC);
  float cloudLod = mapLod(uClouds, footprint);
  float cloud = uReady > 0.5 ? pow(textureLod(uClouds, cuv, cloudLod).r, 1.7) : 0.0;

  float ndl = dot(p, uSun);
  vec3 sunT = sunTransmittance(p + p * 0.0005);
  float lit = max(ndl, 0.0);

  // Each cloud throws a shadow, offset away from the Sun in the cloud layer's frame.
  vec3 sunC = uCloudM * uSun;
  vec3 shadowN = normalize(nC - sunC * 0.006 / max(ndl, 0.12));
  float cloudShadow = uReady > 0.5 ? pow(textureLod(uClouds, sphereUV(shadowN), cloudLod).r, 1.7) : 0.0;

  // Water reads off the map itself: it is the only place blue beats red by this much.
  float water = smoothstep(0.02, 0.09, day.b - day.r);
  // The map is a bright, flat composite. Deepening it restores the contrast a real
  // photograph of Earth has between dark ocean and pale desert.
  vec3 deep = day * mix(vec3(0.62), vec3(0.45, 0.62, 0.95), water);
  vec3 ground = deep * lit * sunT * SUN_I * 0.27 * (1.0 - cloudShadow * 0.6);

  vec3 v = -rd;
  vec3 h = normalize(uSun + v);
  float ndh = max(dot(p, h), 0.0);
  float ndv = max(dot(p, v), 0.0);
  float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  float glint = (pow(ndh, 900.0) * 2.2 + pow(ndh, 90.0) * 0.1) * (0.3 + fres * 3.0);
  ground += water * glint * sunT * lit * (1.0 - cloud) * vec3(1.0, 0.96, 0.9);

  vec3 cloudColor = vec3(0.9, 0.91, 0.93) * sunT * SUN_I * 0.24 * (lit * 0.9 + 0.1 * smoothstep(-0.05, 0.3, ndl));
  vec3 surface = mix(ground, cloudColor, cloud);

  float night = 1.0 - smoothstep(-0.06, 0.09, ndl);
  surface += lights * vec3(1.0, 0.74, 0.46) * 3.4 * night * (1.0 - cloud * 0.85);

  color = vec4((surface * viewT + inscatter) * uLit, 1.0);
}`

/** The Moon, the planets, Saturn's rings and the dot each one is from far away. */
export const BODY = `#version 300 es
precision highp float;
${RAY}
uniform vec3 uC;
uniform float uRadius;
uniform vec3 uSun;
uniform mat3 uM;
uniform sampler2D uMap;
uniform sampler2D uRing;
uniform float uHasMap;
uniform float uHasRing;
uniform float uRingKind;
uniform float uPixel;
uniform float uLit;
uniform vec3 uTint;
uniform vec3 uHaze;
uniform float uHazeAmount;
uniform float uRelief;
uniform float uDetail;
uniform float uFlat;
uniform float uBanded;
out vec4 color;
${SPHERE_UV}
${NOISE}

const float RING_IN = 1.239;
const float RING_OUT = 2.27;

// Uranus: a handful of thin dark threads, nothing like Saturn. Positions are the real ones.
float threads(float r, float footprint) {
  float w = max(0.004, footprint);
  float k = 0.004 / w;
  float a = 0.0;
  a += exp(-pow((r - 1.64) / w, 2.0)) * 0.5;
  a += exp(-pow((r - 1.68) / w, 2.0)) * 0.4;
  a += exp(-pow((r - 1.75) / w, 2.0)) * 0.55;
  a += exp(-pow((r - 1.87) / w, 2.0)) * 0.5;
  a += exp(-pow((r - 2.0) / (w * 1.6), 2.0)) * 1.0;
  return min(1.0, a * k) * 0.52;
}

float ringAlpha(float r, float footprint) {
  if (uRingKind > 1.5) return threads(r, footprint);
  if (r < RING_IN - footprint || r > RING_OUT + footprint) return 0.0;
  float u = (r - RING_IN) / (RING_OUT - RING_IN);
  float lod = max(0.0, log2(max(float(textureSize(uRing, 0).x) * footprint / (RING_OUT - RING_IN), 1e-4)));
  float edge = smoothstep(0.0, footprint + 1e-3, r - RING_IN) * smoothstep(0.0, footprint + 1e-3, RING_OUT - r);
  return textureLod(uRing, vec2(u, 0.5), lod).r * edge;
}

void main() {
  vec3 rd = viewRay();
  vec3 ro = -uC / uRadius;
  float b = dot(ro, rd);
  float rr = dot(ro, ro);
  vec3 cr = cross(ro, rd);
  float dc2 = dot(cr, cr);
  float dc = sqrt(dc2);
  float pw = uPixel * sqrt(rr);

  vec3 sunB = uM * uSun;
  vec4 out0 = vec4(0.0);

  // Seen from far enough the disc is under a pixel. It still has to be visible,
  // as a point of light that grows into a world on approach.
  float far = smoothstep(1.2, 5.0, pw);
  if (far > 0.0) {
    float w = pw * 1.6;
    float glow = exp(-dc2 / (w * w));
    float phase = 0.5 + 0.5 * dot(normalize(ro), uSun);
    out0.rgb += uTint * (0.5 + phase) * glow * far * 1.7;
  }

  float h = 1.0 - dc2;
  float tPlanet = h > 0.0 && b < 0.0 ? -b - sqrt(h) : -1.0;

  vec3 planet = vec3(0.0);
  float planetA = 0.0;
  if (tPlanet > 0.0) {
    vec3 p = ro + rd * tPlanet;
    vec3 nB = uM * p;
    vec2 uv = sphereUV(nB);
    float footprint = uPixel * tPlanet / max(dot(normalize(p), -rd), 0.12);
    float lod = mapLod(uMap, footprint);
    vec3 albedo = uHasMap > 0.5 ? pow(textureLod(uMap, uv, lod).rgb, vec3(2.2)) : uTint;
    if (uBanded > 0.2 && uBanded < 0.6 && uHasMap > 0.5) {
      // The ice giants' maps are far bluer than the planets look. Left alone, Neptune
      // is the one neon thing on a page that has none.
      albedo = mix(vec3(dot(albedo, vec3(0.33))), albedo, 0.66);
    }
    if (uBanded > 0.6 && uHasMap > 0.5) {
      // These maps are bright, flat composites. A little contrast and colour gives back
      // the depth in the bands that a photograph of the real thing has.
      float l = dot(albedo, vec3(0.33));
      albedo = mix(vec3(l), albedo, 1.3);
      albedo = pow(max(albedo, vec3(0.0)), vec3(1.16)) * 1.14;
    }
    vec3 shadeN = nB;

    if (uDetail > 0.0) {
      float d1 = fbm(nB * 42.0);
      float d2 = fbm(nB * 190.0);
      albedo *= 1.0 + (d1 - 0.5) * 0.5 * uDetail + (d2 - 0.5) * 0.45 * uDetail;
    }
    if (uRelief > 0.0 && uHasMap > 0.5) {
      // No height map, so the albedo stands in for one. On a cratered body the
      // two correlate enough to give the terminator its long shadows.
      float e = max(0.0009, footprint * 0.16);
      float l0 = dot(textureLod(uMap, uv, lod).rgb, vec3(0.33));
      float lx = dot(textureLod(uMap, uv + vec2(e, 0.0), lod).rgb, vec3(0.33));
      float ly = dot(textureLod(uMap, uv + vec2(0.0, e), lod).rgb, vec3(0.33));
      vec3 east = normalize(vec3(-nB.y, nB.x, 0.0001));
      vec3 north = cross(nB, east);
      shadeN = normalize(nB - (east * (lx - l0) - north * (ly - l0)) * uRelief * 0.0009 / e);
      if (uDetail > 0.0) {
        float q = 0.012;
        float f0 = fbm(nB * 70.0);
        shadeN = normalize(shadeN - (east * (fbm((nB + east * q) * 70.0) - f0)
          + north * (fbm((nB + north * q) * 70.0) - f0)) * 0.55 * uDetail);
      }
    }

    float ndl = dot(shadeN, sunB);
    float ndv = max(dot(nB, uM * -rd), 0.0);
    float lit = max(ndl, 0.0);
    // Airless dust throws light straight back (Lommel-Seeliger), so the Moon has
    // no soft shoulder. Gas darkens toward the limb. The two are a real difference.
    float lommel = lit / max(lit + max(ndv, 0.1), 0.02) * 1.6;
    // Clamped, or the last pixel of the limb goes to black and the disc gets a dotted
    // outline wherever that pixel falls.
    float lambert = lit * pow(max(ndv, 0.14), 0.22);
    float diffuse = mix(lambert, lommel, uFlat);

    float shadow = 1.0;
    if (uHasRing > 0.5 && sunB.z != 0.0) {
      float ts = -nB.z / sunB.z;
      if (ts > 0.0) shadow = 1.0 - ringAlpha(length((nB + sunB * ts).xy), 0.01) * 0.82;
    }
    // A trace of earthshine and scattered light, so a shadow is dark rather than a hole.
    planet = albedo * (diffuse * shadow * mix(1.9, 1.45, uBanded) + 0.006);

    if (uHazeAmount > 0.0) {
      float rim = pow(1.0 - ndv, 3.2);
      planet += uHaze * rim * smoothstep(-0.25, 0.5, dot(nB, sunB)) * uHazeAmount * 0.9;
    }
    planetA = smoothstep(1.0, 1.0 - max(pw * 1.5, 1e-4), dc);
  }

  // The haze beyond the limb is what makes a disc read as a world with air.
  if (uHazeAmount > 0.0 && dc > 1.0 - pw * 3.0 && dc < 1.12) {
    vec3 side = normalize(ro + rd * -b);
    float lightSide = smoothstep(-0.3, 0.55, dot(uM * side, sunB));
    float halo = exp(-max(dc - 1.0, 0.0) * 70.0);
    out0.rgb += uHaze * halo * lightSide * uHazeAmount * 0.65;
  }

  vec3 c = out0.rgb;
  float a = 0.0;

  // Saturn's rings pass in front of the planet on one side and behind on the other.
  vec4 ring = vec4(0.0);
  float tRing = -1.0;
  if (uHasRing > 0.5) {
    vec3 roB = uM * ro;
    vec3 rdB = uM * rd;
    tRing = -roB.z / rdB.z;
    if (tRing > 0.0) {
      vec3 pr = roB + rdB * tRing;
      float r = length(pr.xy);
      float ringFoot = uPixel * tRing / max(abs(rdB.z), 0.04);
      float alpha = ringAlpha(r, ringFoot);
      if (alpha > 0.0) {
        float bs = dot(pr, sunB);
        // The planet's shadow across the rings, with a real penumbra instead of a
        // staircase at the edge.
        float hs = bs * bs - dot(pr, pr) + 1.0;
        float shadow = bs < 0.0 ? 1.0 - smoothstep(-0.03, 0.03, hs) : 1.0;
        vec3 ringColor = vec3(0.62, 0.55, 0.45) * (0.5 + alpha * 0.55);
        if (uRingKind > 1.5) {
          ringColor = vec3(0.62, 0.7, 0.74) * 0.62;
        } else {
          // Thousands of ringlets, warmer inside and cooler out. The map only has opacity.
          float ringlets = vnoise(vec3(r * 170.0, 0.0, 0.0)) * 0.6 + vnoise(vec3(r * 52.0, 3.0, 0.0)) * 0.4;
          vec3 tone = mix(vec3(0.74, 0.62, 0.46), vec3(0.56, 0.56, 0.54), smoothstep(1.5, 2.2, r));
          ringColor = tone * (0.42 + alpha * 0.6) * (0.72 + ringlets * 0.56);
        }
        ring = vec4(ringColor * shadow * alpha, alpha * 0.96);
      }
    }
  }

  bool ringInFront = tRing > 0.0 && (tPlanet < 0.0 || tRing < tPlanet);
  if (!ringInFront) { c = c * (1.0 - ring.a) + ring.rgb; a = ring.a; }
  c = c * (1.0 - planetA) + planet * planetA;
  a = a + (1.0 - a) * planetA;
  if (ringInFront) { c = c * (1.0 - ring.a) + ring.rgb; a = a + (1.0 - a) * ring.a; }

  color = vec4(c * uLit, a);
}`

/** Rocks, lumpy and lit from the Sun's side, rushing past as the belt is crossed. */
export const ROCK_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aSeed;
uniform vec2 uRes;
uniform vec2 uShift;
uniform float uTan;
uniform float uTravel;
uniform float uLevel;
uniform float uDpr;
out float vSeed;
out float vLight;
void main() {
  float z = fract(aSeed.z - uTravel) * 46.0 + 0.5;
  // Clear of the middle of the frame: the camera threads the gap, it does not ram it.
  vec2 side = aSeed.xy - 0.5;
  side += sign(side) * 0.06;
  vec2 p = side * vec2(70.0, 46.0);
  float aspect = uRes.x / uRes.y;
  gl_Position = vec4(p.x / (z * uTan * aspect) + uShift.x, p.y / (z * uTan) + uShift.y, 0.0, 1.0);
  float radius = 0.03 + aSeed.w * aSeed.w * aSeed.w * 0.5;
  gl_PointSize = clamp(radius / (z * uTan) * uRes.y, 1.2 * uDpr, 150.0 * uDpr);
  float fadeIn = smoothstep(46.5, 26.0, z);
  float fadeNear = smoothstep(0.5, 2.4, z);
  vLight = fadeIn * fadeNear * uLevel;
  vSeed = aSeed.w * 37.0 + aSeed.x * 11.0;
}`

export const ROCK_FRAG = `#version 300 es
precision highp float;
in float vSeed;
in float vLight;
uniform vec3 uSunView;
out vec4 color;
${NOISE}
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  p.y = -p.y;
  float a = atan(p.y, p.x);
  float edge = 0.62 + 0.3 * vnoise(vec3(cos(a) * 1.6 + vSeed, sin(a) * 1.6, vSeed));
  float r = length(p) / edge;
  if (r > 1.0) discard;
  vec3 n = normalize(vec3(p / edge, sqrt(max(1.0 - r * r, 0.0)) + 0.001));
  float bump = vnoise(vec3(p * 5.0 + vSeed, vSeed));
  float lit = max(dot(normalize(n + (bump - 0.5) * 0.5), uSunView), 0.0);
  vec3 rock = mix(vec3(0.32, 0.27, 0.22), vec3(0.2, 0.19, 0.18), fract(vSeed));
  color = vec4(rock * (lit * 4.2 + 0.03) * vLight, smoothstep(1.0, 0.86, r) * vLight);
}`

export const GALAXY_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aColor;
layout(location = 2) in float aSize;
uniform vec2 uRes;
uniform vec3 uF;
uniform vec3 uR;
uniform vec3 uU;
uniform vec3 uEye;
uniform vec2 uShift;
uniform float uTan;
uniform float uDpr;
uniform float uBright;
uniform float uMaxSize;
out vec3 vColor;
void main() {
  vec3 rel = aPos - uEye;
  float z = dot(rel, uF);
  float aspect = uRes.x / uRes.y;
  if (z <= 0.02) { gl_Position = vec4(2.0, 2.0, 0.0, 1.0); gl_PointSize = 0.0; vColor = vec3(0.0); return; }
  gl_Position = vec4(dot(rel, uR) / (z * uTan * aspect) + uShift.x, dot(rel, uU) / (z * uTan) + uShift.y, 0.0, 1.0);
  float px = aSize * uRes.y / (z * uTan * 2.0);
  // A particle under a pixel is still that much light. Below one pixel it stays
  // one pixel and dims in proportion, so the disc keeps its total brightness as
  // the camera pulls away instead of going dark.
  float size = max(px, 1.1 * uDpr);
  float energy = min(1.0, (px * px) / (size * size) + 0.0);
  // Flying through the disc, a nearby particle stays a star. Uncapped it is a blurry
  // dinner plate, and a thousand of them turn the screen into white soup.
  gl_PointSize = min(size, uMaxSize * uDpr);
  vColor = aColor * uBright * mix(energy, 1.0, 0.06);
}`

export const GALAXY_FRAG = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 color;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float a = (1.0 - d) * (1.0 - d);
  color = vec4(vColor * a, 0.0);
}`

/** Whole galaxies as single sprites, each with its own tilt and shape. */
export const DEEP_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aColor;
layout(location = 2) in vec4 aShape;
uniform vec2 uRes;
uniform vec3 uF;
uniform vec3 uR;
uniform vec3 uU;
uniform vec3 uEye;
uniform vec2 uShift;
uniform float uTan;
uniform float uDpr;
uniform float uBright;
out vec3 vColor;
out vec4 vShape;
void main() {
  vec3 rel = aPos - uEye;
  float z = dot(rel, uF);
  float aspect = uRes.x / uRes.y;
  if (z <= 1.0) { gl_Position = vec4(2.0, 2.0, 0.0, 1.0); gl_PointSize = 0.0; vColor = vec3(0.0); vShape = aShape; return; }
  gl_Position = vec4(dot(rel, uR) / (z * uTan * aspect) + uShift.x, dot(rel, uU) / (z * uTan) + uShift.y, 0.0, 1.0);
  float px = aShape.z * uRes.y / (z * uTan * 2.0);
  gl_PointSize = clamp(px, 2.0 * uDpr, 220.0 * uDpr);
  vColor = aColor * uBright * min(1.0, px * px / 3.0 + 0.2);
  vShape = aShape;
}`

export const DEEP_FRAG = `#version 300 es
precision highp float;
in vec3 vColor;
in vec4 vShape;
out vec4 color;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float c = cos(vShape.x), s = sin(vShape.x);
  vec2 q = vec2(c * p.x - s * p.y, (s * p.x + c * p.y) / max(vShape.y, 0.08));
  float r = length(q);
  if (r > 1.0) discard;
  float disc = pow(1.0 - r, 2.2);
  float core = exp(-r * r * 90.0) * 2.6;
  float arms = 0.0;
  if (vShape.w > 0.5) {
    float th = atan(q.y, q.x);
    arms = 0.5 + 0.5 * sin(th * 2.0 - log(r + 0.02) * 4.2 + vShape.w * 9.0);
    disc *= 0.45 + arms * 0.9;
  }
  color = vec4(vColor * disc + mix(vColor, vec3(1.0, 0.88, 0.72), 0.6) * core, 0.0);
}`

export const DOWN = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uFirst;
out vec4 color;
void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec2 t = uTexel;
  vec3 c = texture(uTex, uv).rgb * 4.0;
  c += texture(uTex, uv + t * vec2(-1.0, -1.0)).rgb;
  c += texture(uTex, uv + t * vec2(1.0, -1.0)).rgb;
  c += texture(uTex, uv + t * vec2(-1.0, 1.0)).rgb;
  c += texture(uTex, uv + t * vec2(1.0, 1.0)).rgb;
  c /= 8.0;
  // Firefly clamp: one sun-glint pixel must not bloom into a flickering disc.
  if (uFirst > 0.5) c = min(c, vec3(24.0));
  color = vec4(c, 1.0);
}`

export const UP = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uWeight;
out vec4 color;
void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec2 t = uTexel * 0.5;
  vec3 c = texture(uTex, uv + vec2(-t.x * 2.0, 0.0)).rgb;
  c += texture(uTex, uv + vec2(-t.x, t.y)).rgb * 2.0;
  c += texture(uTex, uv + vec2(0.0, t.y * 2.0)).rgb;
  c += texture(uTex, uv + vec2(t.x, t.y)).rgb * 2.0;
  c += texture(uTex, uv + vec2(t.x * 2.0, 0.0)).rgb;
  c += texture(uTex, uv + vec2(t.x, -t.y)).rgb * 2.0;
  c += texture(uTex, uv + vec2(0.0, -t.y * 2.0)).rgb;
  c += texture(uTex, uv + vec2(-t.x, -t.y)).rgb * 2.0;
  color = vec4(c / 12.0 * uWeight, 1.0);
}`

/**
 * ACES for the film response, then vignette and grain. The grain matters more
 * than it looks: dark gradients in an 8-bit canvas band hard, and space is
 * nothing but dark gradients.
 */
export const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2 uRes;
uniform float uBloomAmount;
uniform float uExposure;
uniform float uTime;
uniform float uFade;
out vec4 color;
vec3 aces(vec3 x) {
  x *= 0.72;
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture(uScene, uv).rgb;
  c += texture(uBloom, uv).rgb * uBloomAmount;
  c *= uExposure;
  c = aces(c);
  c = pow(c, vec3(1.0 / 2.2));
  vec2 q = uv - 0.5;
  c *= 1.0 - dot(q, q) * 0.55;
  c += (noise(gl_FragCoord.xy + fract(uTime) * 311.0) - 0.5) * 0.012;
  color = vec4(c * uFade, 1.0);
}`
