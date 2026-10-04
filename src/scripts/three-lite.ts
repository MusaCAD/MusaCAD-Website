/**
 * The only parts of three.js the hero canvas draws with. Importing these by name
 * (instead of the whole namespace) lets the bundler drop the rest of the library —
 * roughly half of it — which is most of the home page's main-thread time on phones.
 */
export {
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
