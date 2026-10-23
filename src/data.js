// Todo lo que aparece en la web sale del CV y de github.com/itsguzman48.
export const contacto = {
  email: 'inigoguz48@gmail.com',
  github: 'https://github.com/itsguzman48',
  linkedin: 'https://linkedin.com/in/iniguzman',
  lugar: 'Getxo, Bizkaia',
};

// La primera lámina de cada proyecto es la principal (sale también en el índice visual).
export const proyectos = [
  {
    id: 'soc',
    n: 1,
    titulo: 'SOC multi-cloud con IA',
    meta: 'Proyecto final ASIR · 2026',
    linea: 'Honeypots en dos nubes que capturan ataques SSH reales, y una IA que los clasifica.',
    cifra: '35.600',
    cifraTexto: 'intentos de entrada por SSH en 14 días, desde 80 países',
    texto: [
      'Honeypots Cowrie en Docker en dos nodos de DigitalOcean (Nueva York y Fráncfort) y un nodo de análisis en Azure cerrado a internet, unido a ellos solo por WireGuard; siempre es Azure quien abre la conexión.',
      'Un colector en Python recoge los logs en directo, Llama 3.1 clasifica los comandos de los atacantes según MITRE ATT&CK y todo acaba en Grafana, Power BI y un bot de Telegram. Entre lo que salió: una campaña de fuerza bruta dirigida a nodos de Solana.',
    ],
    corto: 'Docker · WireGuard · Llama 3.1 · Grafana',
    stack: 'DigitalOcean, Azure, WireGuard, Docker, Python, Llama 3.1, SQLite, Grafana, Power BI',
    laminas: [
      { img: 'mapa_ataques', alt: 'Mapa mundial de Grafana con los orígenes de los ataques SSH capturados.', pie: 'Origen de los ataques, en Grafana' },
      { img: 'grafana_comandos', alt: 'Panel de Grafana con los comandos que ejecutaron los atacantes.', pie: 'Comandos de los atacantes' },
      { img: 'top_paises', alt: 'Gráfico de barras con los países de origen con más eventos.', pie: 'Países con más eventos' },
    ],
    enlaces: [
      { t: 'Repositorio', u: 'https://github.com/itsguzman48/Infraestructura-Hibrida-de-Ciberinteligencia-SOC-Multi-Cloud-con-IA' },
    ],
  },
  {
    id: 'haizelab',
    n: 2,
    titulo: 'HaizeLab',
    meta: 'Reto de especialización · equipo de 3 · 2026',
    linea: '¿Ha bajado la Zona de Bajas Emisiones de Bilbao el NO₂? Lo medimos.',
    cifra: '−6,4 %',
    cifraTexto: 'de NO₂ atribuible a la ZBE de Bilbao (p < 0,001)',
    texto: [
      'La pregunta era si la ZBE ha bajado el NO₂ en el centro más de lo que ha bajado en el resto del área metropolitana. La respondimos con diferencias en diferencias sobre 332.776 registros horarios de 8 estaciones (2022–2026), con controles de meteorología y un placebo con SO₂.',
      'Por debajo, una plataforma en tiempo real con Docker Compose, Node-RED, InfluxDB y Grafana, un servidor MCP de solo lectura y un chatbot RAG.',
    ],
    cita: 'La conclusión es un efecto confirmado pero moderado: algo más de la mitad de la bajada observada en el centro se habría producido igualmente.',
    corto: 'Python · Node-RED · InfluxDB · RAG',
    stack: 'Python, Docker Compose, Node-RED, InfluxDB, Grafana, FastAPI, RAG',
    laminas: [
      { img: 'haize_dashboard', alt: 'Panel de decisión de HaizeLab con la evolución del NO₂ dentro y fuera de la ZBE y el efecto estimado.', pie: 'Panel de decisión del estudio' },
      { img: 'haize_did', alt: 'Gráfico de diferencias en diferencias del NO₂ antes y después de la ZBE, dentro y fuera.', pie: 'Diferencias en diferencias' },
      { img: 'arquitectura_haizelab', alt: 'Diagrama de arquitectura: fuentes abiertas, Node-RED, InfluxDB y consumo desde Grafana, un servidor MCP y un chatbot.', pie: 'Arquitectura de la plataforma' },
    ],
    enlaces: [{ t: 'Repositorio', u: 'https://github.com/itsguzman48/haizelab-' }],
  },
  {
    id: 'cnc',
    n: 3,
    titulo: 'Desgaste de herramienta CNC',
    meta: 'Proyecto personal · 2026',
    linea: 'Saber si una fresa está gastada leyendo solo la telemetría de la máquina.',
    cifra: '48',
    cifraTexto: 'señales de servomotores y husillo, de 18 experimentos de la Universidad de Michigan',
    texto: [
      'Mantenimiento predictivo con un XGBoost explicado con SHAP, para que en planta se entienda por qué avisa. Lo fácil aquí es mezclar filas de la misma pasada y sacar un 98 % que no aguanta una pieza nueva, así que validé con StratifiedGroupKFold por experimento.',
      'Tiene app en Streamlit Cloud, tests con pytest y CI en GitHub Actions.',
    ],
    corto: 'XGBoost · SHAP · Streamlit',
    stack: 'Python, XGBoost, SHAP, Streamlit, pytest, GitHub Actions',
    laminas: [
      { img: 'cnc_app', alt: 'La app de Streamlit: diagnóstico del modelo, probabilidad de desgaste y telemetría del husillo.', pie: 'La app, en Streamlit Cloud' },
      { img: 'shap_summary_beeswarm', alt: 'Gráfico SHAP beeswarm con las variables que más pesan en la predicción.', pie: 'Qué variables pesan, según SHAP' },
      { img: 'cnc_senales', alt: 'Comparativa de la corriente del husillo con herramienta sana y desgastada.', pie: 'Husillo: fresa sana frente a gastada' },
    ],
    enlaces: [
      { t: 'Probar la app', u: 'https://cnctoolwearapp.streamlit.app/' },
      { t: 'Repositorio', u: 'https://github.com/itsguzman48/cnc-tool-wear-prediction' },
    ],
  },
  {
    id: 'celestial',
    n: 4,
    titulo: 'Celestial Constellation AI',
    meta: 'Proyecto personal · 2026',
    linea: 'Un planetario en el navegador que reconoce la constelación que tocas.',
    cifra: '99,89 %',
    cifraTexto: 'de aciertos a la primera con ruido simulado de ±2°',
    texto: [
      'Un pipeline en Python filtra el catálogo HYG (Hipparcos y Gaia) de 119.614 a 5.188 estrellas visibles a simple vista. El visor calcula en tiempo real dónde está cada una según tu posición y la hora sidérea, y al tocar el cielo reconoce la constelación por similitud angular, la misma idea que usan los satélites para orientarse.',
      'En el móvil sigue la brújula y el giroscopio.',
    ],
    corto: 'JavaScript · Canvas · Python',
    stack: 'JavaScript, HTML5 Canvas, Python, pytest, Vercel',
    movil: true,
    laminas: [
      { img: 'celestial_app', alt: 'El visor en escritorio: cielo nocturno con constelaciones y un panel que identifica la Osa Mayor.', pie: 'El visor, en escritorio' },
      { img: 'celestial_movil', alt: 'El visor en un móvil, con la Osa Mayor dibujada.', pie: 'Y en el móvil' },
    ],
    enlaces: [
      { t: 'Abrir el visor', u: 'https://celestial-constellation-ai.vercel.app' },
      { t: 'Repositorio', u: 'https://github.com/itsguzman48/celestial-constellation-ai' },
    ],
  },
];

export const luxai = {
  id: 'luxai',
  n: 5,
  titulo: 'LUXAI Video',
  meta: 'Proyecto propio',
  linea: 'Fotos de villas y alquileres de lujo convertidas en vídeo de estilo aéreo con IA.',
  corto: 'Google Flow · Astro · TypeScript',
  img: 'luxai',
};

export const experiencia = [
  { t: 'Técnico de sistemas · Internet-Idee', d: 'Cosenza (Italia), Erasmus de 3 meses. Servidores Linux y Windows Server, máquinas virtuales, soporte y redes.', a: '2026' },
  { t: 'Teleoperador de atención al cliente · Vodafone', d: 'Atención técnica por teléfono y resolución de incidencias.', a: '2020' },
];

export const formacion = [
  { t: 'Curso de Especialización en IA y Big Data', d: 'CIFP Somorrostro, en curso. Big Data aplicado, sistemas de Big Data, modelos de IA (NLP y visión).', a: '2026–27' },
  { t: 'CFGS Administración de Sistemas Informáticos en Red', d: 'CIFP Somorrostro.', a: '2024–26' },
  { t: 'Curso de Unity y C#', d: 'Seis meses.', a: '2023' },
];

export const herramientas = [
  { g: 'Sistemas y cloud', l: ['Linux', 'Windows Server', 'Docker', 'DigitalOcean', 'Azure', 'PowerShell', 'Bash', 'Git', 'Grafana'] },
  { g: 'Datos e IA', l: ['Python', 'SQL y PL/SQL', 'Pandas', 'Polars', 'Jupyter', 'InfluxDB', 'MongoDB', 'Node-RED'] },
];

export const idiomas = [
  { t: 'Español', a: 'nativo' },
  { t: 'Inglés', a: 'intermedio-alto' },
  { t: 'Euskera', a: 'intermedio' },
];
