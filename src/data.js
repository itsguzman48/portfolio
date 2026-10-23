// Todo lo que aparece en la web sale del CV y de github.com/itsguzman48.
export const contacto = {
  email: 'inigoguz48@gmail.com',
  github: 'https://github.com/itsguzman48',
  linkedin: 'https://linkedin.com/in/iniguzman',
  lugar: 'Getxo, Bizkaia',
};

export const proyectos = [
  {
    id: 'soc',
    titulo: 'SOC multi-cloud con IA',
    meta: 'Proyecto final ASIR · 2026',
    img: 'mapa_ataques',
    alt: 'Mapa mundial de Grafana con los orígenes de los ataques SSH capturados, marcados en rojo.',
    cifra: '35.600',
    cifraTexto: 'intentos de entrada por SSH en 14 días, desde 80 países',
    texto:
      'Monté honeypots Cowrie en Docker en dos nodos de DigitalOcean (Nueva York y Fráncfort) y un nodo de análisis en Azure cerrado a internet. Se hablan solo por WireGuard, y siempre es Azure quien abre la conexión. Un colector en Python recoge los logs en directo, Llama 3.1 clasifica los comandos de los atacantes y los mapea a MITRE ATT&CK, y todo acaba en Grafana, Power BI y un bot de Telegram. Entre lo que salió: una campaña de fuerza bruta dirigida a nodos de Solana.',
    stack: 'DigitalOcean · Azure · WireGuard · Docker · Python · Llama 3.1 · SQLite · Grafana · Power BI',
    enlaces: [
      { t: 'Repositorio', u: 'https://github.com/itsguzman48/Infraestructura-Hibrida-de-Ciberinteligencia-SOC-Multi-Cloud-con-IA' },
    ],
  },
  {
    id: 'haizelab',
    titulo: 'HaizeLab',
    meta: 'Reto de especialización · equipo de 3 · 2026',
    img: 'arquitectura_haizelab',
    alt: 'Diagrama de arquitectura de HaizeLab: fuentes abiertas, ingesta con Node-RED, almacenamiento en InfluxDB y consumo desde Grafana, un servidor MCP y un chatbot.',
    cifra: '−6,4 %',
    cifraTexto: 'de NO₂ atribuible a la Zona de Bajas Emisiones de Bilbao (p < 0,001)',
    texto:
      'La pregunta era si la ZBE de Bilbao ha bajado el NO₂ en el centro más de lo que ha bajado en el resto del área metropolitana. La respondimos con diferencias en diferencias sobre 332.776 registros horarios de 8 estaciones (2022–2026), con controles de meteorología y un placebo con SO₂. Por debajo, una plataforma en tiempo real con Docker Compose, Node-RED, InfluxDB y Grafana, un servidor MCP de solo lectura y un chatbot RAG.',
    stack: 'Python · Docker Compose · Node-RED · InfluxDB · Grafana · FastAPI · RAG',
    enlaces: [{ t: 'Repositorio', u: 'https://github.com/itsguzman48/haizelab-' }],
  },
  {
    id: 'cnc',
    titulo: 'Desgaste de herramienta CNC',
    meta: 'Proyecto personal · 2026',
    img: 'shap_summary_beeswarm',
    alt: 'Gráfico SHAP beeswarm con las variables que más pesan en la predicción de desgaste de la fresa.',
    cifra: '48',
    cifraTexto: 'señales de servomotores y husillo, 18 experimentos de la Universidad de Michigan',
    texto:
      'Mantenimiento predictivo: decidir si una fresa está afilada o gastada a partir de la telemetría de la máquina. Lo fácil aquí es mezclar filas de la misma pasada y sacar un 98 % que no se sostiene con una pieza nueva, así que validé con StratifiedGroupKFold por experimento. El modelo es un XGBoost explicado con SHAP, para que en planta se entienda por qué avisa. Tiene app en Streamlit Cloud, tests con pytest y CI en GitHub Actions.',
    stack: 'Python · XGBoost · SHAP · Streamlit · pytest · GitHub Actions',
    enlaces: [
      { t: 'Probar la app', u: 'https://cnctoolwearapp.streamlit.app/' },
      { t: 'Repositorio', u: 'https://github.com/itsguzman48/cnc-tool-wear-prediction' },
    ],
  },
  {
    id: 'celestial',
    titulo: 'Celestial Constellation AI',
    meta: 'Proyecto personal · 2026',
    img: 'celestial',
    alt: 'Captura del visor celeste: cielo nocturno con constelaciones unidas por líneas y un panel que identifica la Osa Mayor.',
    cifra: '5.188',
    cifraTexto: 'estrellas visibles a simple vista, filtradas de un catálogo de 119.614',
    texto:
      'Un planetario en el navegador. Un pipeline en Python filtra el catálogo HYG (datos de Hipparcos y Gaia), el visor calcula en tiempo real dónde está cada estrella según tu posición y la hora sidérea, y al tocar el cielo reconoce la constelación por similitud angular, la misma idea que usan los satélites para orientarse. Con ruido simulado de ±2° acierta a la primera el 99,89 % de las veces. En el móvil sigue la brújula y el giroscopio.',
    stack: 'JavaScript · HTML5 Canvas · Python · pytest · Vercel',
    enlaces: [
      { t: 'Abrir el visor', u: 'https://celestial-constellation-ai.vercel.app' },
      { t: 'Repositorio', u: 'https://github.com/itsguzman48/celestial-constellation-ai' },
    ],
  },
];

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
