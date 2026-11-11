// Evidence base: short original summaries [pt, en, es] with citations and DOI/open links.
// These are paraphrased takeaways, not reproductions of the papers. Always read the original for nuance.
export interface Study {
  id: string;
  topic: 'volume' | 'frequency' | 'intensity' | 'rest' | 'rom' | 'nutrition' | 'load' | 'mechanisms';
  title: [string, string, string];
  takeaway: [string, string, string];
  cite: string;
  url: string;
  app: [string, string, string]; // how Black Iron applies it
}

export const STUDIES: Study[] = [
  {
    id: 'vol2017', topic: 'volume',
    title: ['Volume semanal e hipertrofia', 'Weekly volume and hypertrophy', 'Volumen semanal e hipertrofia'],
    takeaway: [
      'Mais séries semanais por músculo produziram mais crescimento, com relação dose-resposta: ≥10 séries/semana superaram volumes baixos.',
      'More weekly sets per muscle produced more growth in a dose-response fashion; ≥10 sets/week outperformed low volumes.',
      'Más series semanales por músculo produjeron más crecimiento con relación dosis-respuesta; ≥10 series/semana superaron volúmenes bajos.'],
    cite: 'Schoenfeld BJ, Ogborn D, Krieger JW. J Sports Sci. 2017;35(11):1073-1082.',
    url: 'https://doi.org/10.1080/02640414.2016.1210197',
    app: ['Base do contador de séries duras e das zonas MEV/MAV/MRV.', 'Basis of the hard-set counter and MEV/MAV/MRV zones.', 'Base del contador de series efectivas y zonas MEV/MAV/MRV.'],
  },
  {
    id: 'pelland', topic: 'volume',
    title: ['Dose-resposta de volume e frequência (meta-regressão)', 'Volume and frequency dose-response (meta-regression)', 'Dosis-respuesta de volumen y frecuencia'],
    takeaway: [
      'Volume teve efeito positivo com retornos decrescentes; contar séries indiretas como meia série ("fracionada") previu melhor os resultados. Frequência pouco importou quando o volume foi igualado.',
      'Volume had a positive effect with diminishing returns; counting indirect sets as half a set ("fractional") predicted outcomes best. Frequency mattered little once volume was equated.',
      'El volumen tuvo efecto positivo con rendimientos decrecientes; contar series indirectas como media serie predijo mejor. La frecuencia importó poco con volumen igualado.'],
    cite: 'Pelland JC, Remmert JF, Robinson ZP, et al. SportRxiv preprint (2024).',
    url: 'https://sportrxiv.org/index.php/server/preprint/view/537',
    app: ['O app soma 1 série para o músculo principal e 0,5 para os secundários.', 'Black Iron credits 1 set to prime movers and 0.5 to secondary muscles.', 'Black Iron suma 1 serie al músculo principal y 0,5 a los secundarios.'],
  },
  {
    id: 'freq2016', topic: 'frequency',
    title: ['Frequência de treino', 'Training frequency', 'Frecuencia de entrenamiento'],
    takeaway: [
      'Treinar cada músculo pelo menos 2x por semana tendeu a gerar mais hipertrofia do que 1x, em análises sem igualar volume.',
      'Training each muscle at least twice a week tended to beat once a week in analyses where volume was not equated.',
      'Entrenar cada músculo al menos 2 veces por semana tendió a superar 1 vez por semana.'],
    cite: 'Schoenfeld BJ, Ogborn D, Krieger JW. Sports Med. 2016;46(11):1689-1697.',
    url: 'https://doi.org/10.1007/s40279-016-0543-8',
    app: ['Divisões geradas distribuem cada músculo ~2x por semana.', 'Generated splits hit each muscle ~2x per week.', 'Las divisiones generadas trabajan cada músculo ~2x por semana.'],
  },
  {
    id: 'refalo', topic: 'intensity',
    title: ['Proximidade da falha', 'Proximity to failure', 'Proximidad al fallo'],
    takeaway: [
      'Ir até a falha não foi claramente superior a parar perto dela; séries longe da falha estimulam menos.',
      'Training to failure was not clearly superior to stopping close to it; sets far from failure stimulate less.',
      'Llegar al fallo no fue claramente superior a quedarse cerca; series lejos del fallo estimulan menos.'],
    cite: 'Refalo MC, Helms ER, Trexler ET, et al. Sports Med. 2023;53(3):649-665.',
    url: 'https://doi.org/10.1007/s40279-022-01784-y',
    app: ['Só séries com 0–3 RIR contam como "séries duras"; 4+ RIR é aquecimento.', 'Only 0–3 RIR sets count as hard sets; 4+ RIR is warm-up.', 'Solo series a 0–3 RIR cuentan como efectivas; 4+ RIR es calentamiento.'],
  },
  {
    id: 'robinson', topic: 'intensity',
    title: ['RIR, força e hipertrofia (meta-regressões)', 'RIR, strength and hypertrophy (meta-regressions)', 'RIR, fuerza e hipertrofia'],
    takeaway: [
      'A hipertrofia aumentou conforme as séries terminaram mais perto da falha; para força, a relação foi fraca.',
      'Hypertrophy increased as sets ended closer to failure; for strength the relationship was weak.',
      'La hipertrofia aumentó al terminar las series más cerca del fallo; para la fuerza la relación fue débil.'],
    cite: 'Robinson ZP, Pelland JC, Remmert JF, et al. Sports Med. 2024.',
    url: 'https://doi.org/10.1007/s40279-024-02069-2',
    app: ['O mesociclo desce o RIR alvo de 3 → 0-1 ao longo das semanas.', 'The mesocycle lowers the RIR target from 3 → 0-1 across weeks.', 'El mesociclo baja el RIR objetivo de 3 → 0-1.'],
  },
  {
    id: 'rest2016', topic: 'rest',
    title: ['Descanso de 3 min vs 1 min', '3-min vs 1-min rest', 'Descanso de 3 min vs 1 min'],
    takeaway: [
      'Em homens treinados, descansos de ~3 min produziram mais força e mais hipertrofia em alguns músculos do que 1 min.',
      'In trained men, ~3-min rests produced more strength and more hypertrophy in some muscles than 1-min rests.',
      'En hombres entrenados, descansos de ~3 min dieron más fuerza e hipertrofia en algunos músculos que 1 min.'],
    cite: 'Schoenfeld BJ, Pope ZK, Benik FM, et al. J Strength Cond Res. 2016;30(7):1805-1812.',
    url: 'https://doi.org/10.1519/JSC.0000000000001272',
    app: ['Cronômetro auto-regulado: 150–180 s em multiarticulares pesados, 60–90 s em isolados.', 'Auto-regulated timer: 150–180 s for heavy compounds, 60–90 s for isolations.', 'Temporizador: 150–180 s en compuestos pesados, 60–90 s en aislados.'],
  },
  {
    id: 'grgic2018', topic: 'rest',
    title: ['Intervalo de descanso: revisão', 'Rest interval: systematic review', 'Intervalo de descanso: revisión'],
    takeaway: [
      'Descansos mais longos (>60 s) parecem favorecer a hipertrofia em treinados, principalmente em exercícios compostos.',
      'Longer rests (>60 s) appear to favour hypertrophy in trained lifters, especially on compound lifts.',
      'Descansos más largos (>60 s) parecen favorecer la hipertrofia en entrenados.'],
    cite: 'Grgic J, Schoenfeld BJ, Skrepnik M, et al. Sports Med. 2018;48(1):137-151.',
    url: 'https://doi.org/10.1007/s40279-017-0788-x',
    app: ['Sugere descanso maior para exercícios de alto custo sistêmico (SNC).', 'Longer rest for high systemic-cost (CNS) lifts.', 'Más descanso en ejercicios de alto coste sistémico.'],
  },
  {
    id: 'pedrosa', topic: 'rom',
    title: ['Parciais na posição alongada', 'Partials at long muscle lengths', 'Parciales en posición estirada'],
    takeaway: [
      'Na cadeira extensora, a amplitude parcial na parte alongada gerou hipertrofia semelhante ou maior que a parcial encurtada e a amplitude completa.',
      'On the leg extension, partial range in the lengthened portion produced similar or greater growth than short partials and full range.',
      'En la extensión de cuádriceps, el rango parcial en la parte estirada dio crecimiento similar o mayor.'],
    cite: 'Pedrosa GF, Lima FV, Schoenfeld BJ, et al. Eur J Sport Sci. 2022;22(8):1250-1260.',
    url: 'https://doi.org/10.1080/17461391.2021.1927199',
    app: ['Metadado "Pico: Alongado" e filtro ★ priorizam tensão com o músculo alongado.', '"Peak: Lengthened" metadata and the ★ filter prioritise stretched-position tension.', 'El metadato "Pico: Estirado" y el filtro ★ priorizan la tensión estirada.'],
  },
  {
    id: 'maeo', topic: 'rom',
    title: ['Tríceps overhead vs neutro', 'Overhead vs neutral triceps', 'Tríceps sobre la cabeza vs neutro'],
    takeaway: [
      'Extensões de tríceps com o braço acima da cabeça (cabeça longa alongada) cresceram substancialmente mais que com o braço ao lado do corpo.',
      'Overhead elbow extensions (long head lengthened) grew the triceps substantially more than the arm-by-side position.',
      'Las extensiones por encima de la cabeza hicieron crecer más el tríceps que con el brazo al costado.'],
    cite: 'Maeo S, Wu Y, Huang M, et al. Eur J Sport Sci. 2023;23(7):1240-1250.',
    url: 'https://doi.org/10.1080/17461391.2022.2100279',
    app: ['O gerador prefere tríceps francês/overhead no cabo.', 'The generator prefers overhead/cable triceps extensions.', 'El generador prefiere extensiones por encima de la cabeza.'],
  },
  {
    id: 'kassiano', topic: 'rom',
    title: ['Panturrilha em amplitude alongada', 'Calves at long lengths', 'Gemelos en posición estirada'],
    takeaway: [
      'Parciais na porção alongada da elevação de panturrilha geraram mais hipertrofia do gastrocnêmio do que amplitude completa ou parciais encurtadas.',
      'Calf-raise partials in the lengthened portion grew the gastrocnemius more than full range or short partials.',
      'Parciales en la porción estirada de la elevación de gemelos dieron más hipertrofia.'],
    cite: 'Kassiano W, Costa B, Kunevaliki G, et al. J Strength Cond Res. 2023;37(9):1746-1753.',
    url: 'https://doi.org/10.1519/JSC.0000000000004460',
    app: ['Dica: pause 1–2 s no fundo da panturrilha.', 'Tip: pause 1–2 s at the bottom of calf raises.', 'Consejo: pausa 1–2 s abajo en gemelos.'],
  },
  {
    id: 'wolf', topic: 'rom',
    title: ['Amplitude parcial vs completa (meta-análise)', 'Partial vs full ROM (meta-analysis)', 'ROM parcial vs completo'],
    takeaway: [
      'Amplitude completa tende a ser igual ou melhor no geral; parciais alongadas parecem uma alternativa válida. Evidência ainda limitada.',
      'Full ROM tends to be equal or better overall; lengthened partials look like a valid alternative. Evidence is still limited.',
      'El ROM completo tiende a ser igual o mejor; los parciales estirados parecen una alternativa válida.'],
    cite: 'Wolf M, Androulakis-Korakakis P, Fisher J, et al. Int J Strength Cond. 2023;3(1).',
    url: 'https://doi.org/10.47206/ijsc.v3i1.182',
    app: ['Use amplitude completa por padrão; parciais alongadas como técnica extra na última série.', 'Use full ROM by default; lengthened partials as an extra technique on the last set.', 'ROM completo por defecto; parciales estirados al final.'],
  },
  {
    id: 'loading', topic: 'load',
    title: ['Faixas de repetição', 'Repetition continuum', 'Rangos de repeticiones'],
    takeaway: [
      'Hipertrofia semelhante ocorre de cargas pesadas a leves (~6–30 reps) quando as séries são levadas perto da falha; força favorece cargas altas.',
      'Similar hypertrophy occurs from heavy to light loads (~6–30 reps) when sets go close to failure; strength favours heavy loads.',
      'Hipertrofia similar con cargas pesadas a ligeras (~6–30 reps) cerca del fallo.'],
    cite: 'Schoenfeld BJ, Grgic J, Van Every DW, Plotkin DL. Sports (Basel). 2021;9(2):32.',
    url: 'https://doi.org/10.3390/sports9020032',
    app: ['Compostos pesados 6–10 reps, isolados 10–20 para gerir fadiga.', 'Heavy compounds 6–10 reps, isolations 10–20 to manage fatigue.', 'Compuestos 6–10 reps, aislados 10–20.'],
  },
  {
    id: 'morton', topic: 'nutrition',
    title: ['Proteína e ganho de massa', 'Protein and muscle gain', 'Proteína y ganancia muscular'],
    takeaway: [
      'Suplementar proteína aumentou ganhos de massa magra; o benefício se estabilizou por volta de 1,6 g/kg/dia (IC até ~2,2 g/kg).',
      'Protein supplementation increased lean-mass gains; the benefit plateaued around 1.6 g/kg/day (CI up to ~2.2 g/kg).',
      'La proteína aumentó la masa magra; el beneficio se estabilizó en ~1,6 g/kg/día.'],
    cite: 'Morton RW, Murphy KT, McKellar SR, et al. Br J Sports Med. 2018;52(6):376-384.',
    url: 'https://doi.org/10.1136/bjsports-2017-097608',
    app: ['A dieta usa 2,0 g/kg no bulk e 2,3 g/kg no cut.', 'Diet uses 2.0 g/kg in a bulk and 2.3 g/kg in a cut.', 'La dieta usa 2,0 g/kg en volumen y 2,3 g/kg en definición.'],
  },
  {
    id: 'iraki', topic: 'nutrition',
    title: ['Nutrição no off-season', 'Off-season nutrition', 'Nutrición en off-season'],
    takeaway: [
      'Superávit de ~10–20% e ganho de ~0,25–0,5% do peso por semana para iniciantes/intermediários; avançados devem ser mais conservadores. Avalie médias semanais.',
      'A ~10–20% surplus targeting ~0.25–0.5% bodyweight/week for novice/intermediate; advanced lifters should be more conservative. Judge weekly averages.',
      'Superávit de ~10–20% y ganancia de ~0,25–0,5% del peso/semana; avanzados más conservadores.'],
    cite: 'Iraki J, Fitschen P, Espinar S, Helms E. Sports (Basel). 2019;7(7):154.',
    url: 'https://doi.org/10.3390/sports7070154',
    app: ['Média móvel de 7 dias + Guardião do Lean Bulk + alarme de estagnação.', '7-day moving average + Lean Bulk Guardian + stagnation alarm.', 'Media móvil de 7 días + guardián del volumen limpio.'],
  },
  {
    id: 'helms2014', topic: 'nutrition',
    title: ['Preparação de fisiculturistas naturais', 'Natural bodybuilding contest prep', 'Preparación de culturistas naturales'],
    takeaway: [
      'Em déficit, proteína mais alta (≈2,3–3,1 g/kg de massa magra) e perda lenta de peso ajudam a preservar músculo.',
      'In a deficit, higher protein (≈2.3–3.1 g/kg lean mass) and slow weight loss help preserve muscle.',
      'En déficit, más proteína y pérdida lenta ayudan a preservar músculo.'],
    cite: 'Helms ER, Aragon AA, Fitschen PJ. J Int Soc Sports Nutr. 2014;11:20.',
    url: 'https://doi.org/10.1186/1550-2783-11-20',
    app: ['Modo "cut" sobe a proteína e usa déficit moderado (~20%).', 'Cut mode raises protein and uses a moderate (~20%) deficit.', 'Modo definición sube proteína con déficit moderado.'],
  },
  {
    id: 'mifflin', topic: 'nutrition',
    title: ['Equação de gasto energético', 'Resting energy equation', 'Ecuación de gasto energético'],
    takeaway: [
      'A equação de Mifflin-St Jeor estima o metabolismo basal a partir de peso, altura, idade e sexo.',
      'The Mifflin-St Jeor equation estimates resting energy expenditure from weight, height, age and sex.',
      'La ecuación de Mifflin-St Jeor estima el gasto en reposo.'],
    cite: 'Mifflin MD, St Jeor ST, Hill LA, et al. Am J Clin Nutr. 1990;51(2):241-247.',
    url: 'https://doi.org/10.1093/ajcn/51.2.241',
    app: ['Ponto de partida das calorias; ajuste pela tendência do peso.', 'Starting point for calories; adjust from the weight trend.', 'Punto de partida; ajustar por la tendencia del peso.'],
  },
  {
    id: 'mechanisms', topic: 'mechanisms',
    title: ['Mecanismos da hipertrofia', 'Mechanisms of hypertrophy', 'Mecanismos de la hipertrofia'],
    takeaway: [
      'Revisão clássica: tensão mecânica é o principal motor da hipertrofia; estresse metabólico e dano muscular têm papel secundário/debatido.',
      'Classic review: mechanical tension is the primary driver of hypertrophy; metabolic stress and muscle damage play secondary/debated roles.',
      'Revisión clásica: la tensión mecánica es el motor principal de la hipertrofia.'],
    cite: 'Schoenfeld BJ. J Strength Cond Res. 2010;24(10):2857-2872.',
    url: 'https://doi.org/10.1519/JSC.0b013e3181e840f3',
    app: ['Por isso o app foca em sobrecarga progressiva e tensão, não em "pump".', 'That is why Black Iron focuses on progressive overload and tension, not the pump.', 'Por eso Black Iron se centra en sobrecarga y tensión.'],
  },
];
