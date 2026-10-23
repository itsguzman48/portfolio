// Todo lo que aparece en la web sale del CV, de github.com/itsguzman48 y de luxaivideo.com.
export const contacto = {
  email: 'inigoguz48@gmail.com',
  github: 'https://github.com/itsguzman48',
  linkedin: 'https://linkedin.com/in/iniguzman',
  lugar: 'Getxo, Bizkaia',
};

// bg / ink: color de fondo y del titular de cada proyecto en el carrusel.
// img: lámina principal (plano WebGL) · thumb: miniatura · extra: láminas del detalle.
export const proyectos = [
  {
    id: 'soc',
    titulo: 'SOC multi‑cloud',
    nombre: 'SOC multi‑cloud con IA',
    meta: 'Proyecto final ASIR · 2026',
    linea: 'Honeypots en dos nubes que capturan ataques SSH reales, y una IA que los clasifica.',
    cifra: '35.600',
    cifraTexto: 'intentos de entrada por SSH en 14 días, desde 80 países',
    detalle: 'Honeypots Cowrie en DigitalOcean (Nueva York y Fráncfort) y un nodo de análisis en Azure unido solo por WireGuard. Llama 3.1 clasifica los comandos de los atacantes según MITRE ATT&CK.',
    stack: ['DigitalOcean', 'Azure', 'WireGuard', 'Docker', 'Python', 'Llama 3.1', 'Grafana', 'Power BI'],
    bg: '#355a74', ink: '#f1dfc3',
    img: { src: 'mapa_ataques', alt: 'Mapa mundial de Grafana con los orígenes de los ataques SSH capturados.' },
    thumb: { src: 'grafana_comandos', alt: 'Panel de Grafana con los comandos de los atacantes.' },
    extra: [
      { src: 'grafana_comandos', alt: 'Panel de Grafana con los comandos que ejecutaron los atacantes.', pie: 'Comandos de los atacantes' },
      { src: 'top_paises', alt: 'Gráfico de barras con los países de origen con más eventos.', pie: 'Países con más eventos' },
    ],
    enlaces: [
      { t: 'Repositorio', u: 'https://github.com/itsguzman48/Infraestructura-Hibrida-de-Ciberinteligencia-SOC-Multi-Cloud-con-IA' },
    ],
  },
  {
    id: 'haizelab',
    titulo: 'HaizeLab',
    nombre: 'HaizeLab',
    meta: 'Reto de especialización · equipo de 3 · 2026',
    linea: '¿Ha bajado la Zona de Bajas Emisiones de Bilbao el NO₂? Lo medimos.',
    cifra: '−6,4 %',
    cifraTexto: 'de NO₂ atribuible a la ZBE de Bilbao (p < 0,001)',
    detalle: 'Diferencias en diferencias sobre 332.776 registros horarios de 8 estaciones (2022–2026), encima de una plataforma en tiempo real con Node-RED, InfluxDB, Grafana y un chatbot RAG.',
    stack: ['Python', 'Docker Compose', 'Node-RED', 'InfluxDB', 'Grafana', 'FastAPI', 'RAG'],
    bg: '#33604f', ink: '#efe3c4',
    img: { src: 'haize_dashboard', alt: 'Panel de decisión de HaizeLab con la evolución del NO₂ dentro y fuera de la ZBE.' },
    thumb: { src: 'haize_did', alt: 'Gráfico de diferencias en diferencias del NO₂.' },
    extra: [
      { src: 'haize_did', alt: 'Gráfico de diferencias en diferencias del NO₂ antes y después de la ZBE, dentro y fuera.', pie: 'Diferencias en diferencias' },
      { src: 'arquitectura_haizelab', alt: 'Diagrama de arquitectura: fuentes abiertas, Node-RED, InfluxDB, Grafana, un servidor MCP y un chatbot.', pie: 'Arquitectura de la plataforma' },
    ],
    enlaces: [{ t: 'Repositorio', u: 'https://github.com/itsguzman48/haizelab-' }],
  },
  {
    id: 'cnc',
    titulo: 'Desgaste CNC',
    nombre: 'Desgaste de herramienta CNC',
    meta: 'Proyecto personal · 2026',
    linea: 'Saber si una fresa está gastada leyendo solo la telemetría de la máquina.',
    cifra: '48',
    cifraTexto: 'señales de servomotores y husillo, de 18 experimentos de la Universidad de Michigan',
    detalle: 'Un XGBoost explicado con SHAP y validado con StratifiedGroupKFold por experimento, para que aguante una pieza nueva. App en Streamlit Cloud, tests con pytest y CI en GitHub Actions.',
    stack: ['Python', 'XGBoost', 'SHAP', 'Streamlit', 'pytest', 'GitHub Actions'],
    bg: '#7f4330', ink: '#f8e0c6',
    img: { src: 'cnc_app', alt: 'La app de Streamlit: diagnóstico del modelo, probabilidad de desgaste y telemetría del husillo.' },
    thumb: { src: 'shap_summary_beeswarm', alt: 'Gráfico SHAP de las variables que más pesan.' },
    extra: [
      { src: 'shap_summary_beeswarm', alt: 'Gráfico SHAP beeswarm con las variables que más pesan en la predicción.', pie: 'Qué variables pesan, según SHAP' },
      { src: 'cnc_senales', alt: 'Comparativa de la corriente del husillo con herramienta sana y desgastada.', pie: 'Husillo: fresa sana frente a gastada' },
    ],
    enlaces: [
      { t: 'Probar la app', u: 'https://cnctoolwearapp.streamlit.app/' },
      { t: 'Repositorio', u: 'https://github.com/itsguzman48/cnc-tool-wear-prediction' },
    ],
  },
  {
    id: 'celestial',
    titulo: 'Celestial',
    nombre: 'Celestial Constellation AI',
    meta: 'Proyecto personal · 2026',
    linea: 'Un planetario en el navegador que reconoce la constelación que tocas.',
    cifra: '99,89 %',
    cifraTexto: 'de aciertos a la primera con ruido simulado de ±2°',
    detalle: 'Filtra el catálogo HYG (Hipparcos y Gaia) a 5.188 estrellas visibles, calcula dónde está cada una según tu posición y la hora sidérea, y reconoce la constelación por similitud angular.',
    stack: ['JavaScript', 'HTML5 Canvas', 'Python', 'pytest', 'Vercel'],
    bg: '#232857', ink: '#e8d28f',
    img: { src: 'celestial_app', alt: 'El visor en escritorio: cielo nocturno con constelaciones y la Osa Mayor identificada.' },
    thumb: { src: 'celestial_movil', alt: 'El visor en un móvil.' },
    extra: [
      { src: 'celestial_movil', alt: 'El visor en un móvil, con la Osa Mayor dibujada.', pie: 'En el móvil sigue la brújula y el giroscopio', movil: true },
    ],
    enlaces: [
      { t: 'Abrir el visor', u: 'https://celestial-constellation-ai.vercel.app' },
      { t: 'Repositorio', u: 'https://github.com/itsguzman48/celestial-constellation-ai' },
    ],
  },
  {
    id: 'luxai',
    titulo: 'LUXAI',
    nombre: 'LUXAI Video',
    meta: 'Proyecto propio',
    linea: 'Fotos de villas y alquileres de lujo convertidas en vídeo de estilo aéreo con IA.',
    cifra: '72 h',
    cifraTexto: 'de las fotos al vídeo, sin dron ni rodaje',
    detalle: 'Vídeos de estilo dron generados con IA (Google Flow) a partir de las fotos reales de la propiedad. La web, en español e inglés, está hecha con Astro y TypeScript.',
    stack: ['Google Flow', 'Astro', 'TypeScript'],
    bg: '#5e4636', ink: '#f4dfbd',
    img: { src: 'luxai', alt: 'Portada de luxaivideo.com: una villa al atardecer con el titular «Vuestras fotos ya tienen una película dentro».' },
    thumb: { src: 'luxai_movil', alt: 'La portada de luxaivideo.com en un móvil.' },
    extra: [
      { src: 'luxai_movil', alt: 'La portada de luxaivideo.com en un móvil.', pie: 'La web, en el móvil', movil: true },
    ],
    enlaces: [
      { t: 'luxaivideo.com', u: 'https://luxaivideo.com' },
      { t: 'Repositorio', u: 'https://github.com/itsguzman48/luxaivideo-web' },
    ],
  },
];

export const trayectoria = [
  { a: '2026–27', t: 'Especialización en IA y Big Data', d: 'CIFP Somorrostro · en curso' },
  { a: '2026', t: 'Técnico de sistemas · Internet-Idee', d: 'Cosenza (Italia) · Erasmus, 3 meses' },
  { a: '2024–26', t: 'CFGS Administración de Sistemas (ASIR)', d: 'CIFP Somorrostro' },
  { a: '2020', t: 'Atención al cliente · Vodafone', d: 'Soporte técnico telefónico' },
];

// Bloques de «Sobre mí». Cada frase resume un dato que ya está en `proyectos`
// (detalle, cifra o stack). Cada herramienta tiene que aparecer tal cual en
// algún `proyectos[].stack`: la página lo comprueba al construir.
export const foco = [
  {
    t: 'Sistemas',
    d: 'Cowrie en DigitalOcean, análisis en Azure, unidos por WireGuard.',
    tools: ['DigitalOcean', 'Azure', 'WireGuard'],
  },
  {
    t: 'Datos',
    d: '332.776 registros horarios de 8 estaciones.',
    tools: ['Python', 'InfluxDB', 'Grafana'],
  },
  {
    t: 'Modelos',
    d: 'XGBoost con SHAP. Llama 3.1 clasifica los comandos.',
    tools: ['XGBoost', 'SHAP', 'Llama 3.1'],
  },
  {
    t: 'Web',
    d: 'Planetario en HTML5 Canvas. LUXAI en Astro.',
    tools: ['JavaScript', 'Astro', 'TypeScript'],
  },
];

export const idiomas = [
  { nombre: 'Español', nivel: 'nativo' },
  { nombre: 'Inglés', nivel: 'intermedio-alto' },
  { nombre: 'Euskera', nivel: 'intermedio' },
];
