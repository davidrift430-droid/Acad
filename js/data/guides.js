// Guias educativos. Conteúdo baseado em diretrizes do ACSM, da OMS e em revisões
// científicas populares sobre treino de força (volume, frequência e progressão).
// Texto em HTML simples.

export const GUIDES = [
  {
    id: 'montar-treino',
    emoji: '🧩',
    cor: '#ffc8dd',
    titulo: 'Como montar seu treino',
    resumo: 'O passo a passo que os profissionais usam.',
    html: `
<p>Montar um bom treino é como montar um quebra-cabeça: cada peça tem seu lugar. Siga estes 7 passos:</p>
<h3>1. Defina seu objetivo</h3>
<p>Ganhar massa, emagrecer, ficar mais forte ou ter mais saúde. O objetivo muda <b>repetições</b>, <b>descanso</b> e se vale incluir <b>cardio</b>.</p>
<h3>2. Quantos dias você consegue treinar?</h3>
<p>Seja realista! Um plano de 3 dias que você cumpre é melhor que um de 6 que você abandona.</p>
<h3>3. Escolha a divisão</h3>
<ul>
  <li><b>2–3 dias:</b> corpo inteiro (full body)</li>
  <li><b>4 dias:</b> superiores / inferiores</li>
  <li><b>5–6 dias:</b> push / pull / legs (empurrar, puxar, pernas)</li>
</ul>
<p>O ideal é treinar cada músculo <b>pelo menos 2x por semana</b>.</p>
<h3>4. Escolha os exercícios</h3>
<p>Inclua os padrões de movimento básicos: <b>agachar</b>, <b>dobrar o quadril</b> (terra/stiff), <b>empurrar</b> (supino/desenvolvimento) e <b>puxar</b> (remada/puxada). Depois, complemente com exercícios isolados (rosca, elevação lateral...).</p>
<h3>5. Ordem: grandes primeiro</h3>
<p>Comece pelos exercícios compostos (mais pesados e técnicos), enquanto você está descansado. Isolados e abdômen ficam no final.</p>
<h3>6. Séries e repetições</h3>
<p>Mire em <b>10 a 20 séries por semana para cada músculo</b>. Iniciantes evoluem bem com ~10. Veja o guia “Séries, reps e descanso”.</p>
<h3>7. Progrida!</h3>
<p>Anote tudo (o app faz isso por você 😉) e aumente carga ou repetições aos poucos. Sem progressão, não há evolução.</p>
<div class="callout">💡 Dica: o gerador do Fofit faz todos esses passos automaticamente com base nas suas respostas. Você pode editar tudo depois!</div>`,
  },
  {
    id: 'divisoes',
    emoji: '🗓️',
    cor: '#bde0fe',
    titulo: 'Divisões de treino',
    resumo: 'Full body, ABC, Sup/Inf, PPL: qual escolher?',
    html: `
<h3>Full body (corpo inteiro)</h3>
<p>Treina todos os grandes músculos em cada sessão. <b>Ideal para iniciantes</b> e para quem treina 2–3x por semana.</p>
<h3>Superiores / Inferiores</h3>
<p>Um dia para a parte de cima e outro para pernas. <b>Ótimo com 4 dias</b> por semana: cada músculo treina 2x.</p>
<h3>Push / Pull / Legs (PPL)</h3>
<p><b>Push</b> = empurrar (peito, ombros, tríceps). <b>Pull</b> = puxar (costas, bíceps). <b>Legs</b> = pernas. Funciona com 3 dias (1x por semana) ou 6 dias (2x por semana).</p>
<h3>ABC / ABCDE (“um músculo por dia”)</h3>
<p>Muito popular, mas treina cada músculo só 1x por semana. Estudos indicam que, com o mesmo volume, <b>2x por semana costuma gerar resultados iguais ou melhores</b>.</p>
<table>
<tr><th>Dias</th><th>Sugestão</th></tr>
<tr><td>2</td><td>Full body A/B</td></tr>
<tr><td>3</td><td>Full body A/B/C ou PPL</td></tr>
<tr><td>4</td><td>Sup / Inf 2x</td></tr>
<tr><td>5</td><td>PPL + Sup/Inf</td></tr>
<tr><td>6</td><td>PPL 2x</td></tr>
</table>`,
  },
  {
    id: 'series-reps',
    emoji: '🔢',
    cor: '#caffbf',
    titulo: 'Séries, reps e descanso',
    resumo: 'Quanto fazer para cada objetivo.',
    html: `
<table>
<tr><th>Objetivo</th><th>Reps</th><th>Descanso</th></tr>
<tr><td>💪 Massa</td><td>6–15</td><td>1–2 min</td></tr>
<tr><td>🏋️ Força</td><td>3–6</td><td>2–4 min</td></tr>
<tr><td>🔥 Emagrecer</td><td>10–15</td><td>45–75 s</td></tr>
<tr><td>⚡ Resistência</td><td>15–20+</td><td>30–60 s</td></tr>
</table>
<h3>Quantas séries?</h3>
<p>Para hipertrofia, a faixa mais estudada é de <b>10 a 20 séries semanais por músculo</b>. Comece pelo mínimo e aumente se estiver recuperando bem.</p>
<h3>Quão pesado?</h3>
<p>A carga deve deixar você com <b>1 a 3 repetições “na reserva”</b> no fim da série (veja o guia de intensidade). Se faz 12 fácil e pararia ali “de boa”, está leve demais.</p>
<div class="callout">⏱️ O cronômetro de descanso do app começa sozinho quando você marca uma série!</div>`,
  },
  {
    id: 'progressao',
    emoji: '📈',
    cor: '#ffd6a5',
    titulo: 'Sobrecarga progressiva',
    resumo: 'O segredo para evoluir sempre.',
    html: `
<p>Seu corpo se adapta ao que você pede. Para continuar evoluindo, você precisa pedir <b>um pouquinho mais</b> com o tempo.</p>
<h3>Progressão dupla (a mais fácil)</h3>
<ol>
<li>Escolha uma faixa, ex.: <b>3 séries de 8–12</b>.</li>
<li>Comece com uma carga que você faça ~8 repetições.</li>
<li>A cada treino, tente fazer mais repetições com a mesma carga.</li>
<li>Quando fizer <b>12 em todas as séries</b>, aumente a carga (2–5%) e volte para ~8.</li>
</ol>
<p>O Fofit mostra o que você fez na última vez e sugere quando subir o peso. 🚀</p>
<h3>Outras formas de progredir</h3>
<ul>
<li>Mais séries na semana</li>
<li>Técnica mais limpa e amplitude completa</li>
<li>Descida mais lenta (3 segundos)</li>
<li>Variação mais difícil (ex.: flexão inclinada → flexão normal)</li>
</ul>`,
  },
  {
    id: 'intensidade',
    emoji: '🌶️',
    cor: '#ffadad',
    titulo: 'Intensidade: RIR e RPE',
    resumo: 'Quão perto da falha você deve treinar?',
    html: `
<p><b>RIR</b> = repetições na reserva. É quantas repetições você ainda conseguiria fazer ao terminar a série.</p>
<table>
<tr><th>RIR</th><th>Sensação</th></tr>
<tr><td>0</td><td>Falha: não sai mais nenhuma 😵</td></tr>
<tr><td>1–2</td><td>Muito difícil, ideal para crescer</td></tr>
<tr><td>3–4</td><td>Moderado, bom para técnica e iniciantes</td></tr>
<tr><td>5+</td><td>Leve, aquecimento</td></tr>
</table>
<p>Para a maioria das pessoas, terminar as séries com <b>1–3 RIR</b> traz ótimos resultados com menos cansaço e menor risco de lesão. Ir à falha de vez em quando (em isolados) é ok.</p>`,
  },
  {
    id: 'aquecimento',
    emoji: '🔥',
    cor: '#fdffb6',
    titulo: 'Aquecimento ideal',
    resumo: '5–10 minutos que fazem diferença.',
    html: `
<ol>
<li><b>Geral (3–5 min):</b> bike, esteira ou polichinelo para elevar a temperatura do corpo.</li>
<li><b>Mobilidade (2–3 min):</b> rotações de ombro, quadril e tornozelo; agachamento sem peso.</li>
<li><b>Séries de aproximação:</b> no primeiro exercício, faça 1–2 séries leves (ex.: 50% e 75% da carga) com poucas repetições.</li>
</ol>
<p>Alongamento estático longo antes do treino pesado pode reduzir um pouco a força — deixe para depois ou para outro momento.</p>`,
  },
  {
    id: 'alimentacao',
    emoji: '🥗',
    cor: '#d0f4de',
    titulo: 'Alimentação básica',
    resumo: 'Proteína, calorias e água.',
    html: `
<h3>Proteína 🍗</h3>
<p>Para quem treina, a recomendação mais citada é <b>1,6 a 2,2 g por kg</b> de peso por dia, distribuída em 3–5 refeições.</p>
<h3>Calorias ⚖️</h3>
<ul>
<li><b>Ganhar massa:</b> pequeno superávit (+200 a +300 kcal/dia)</li>
<li><b>Emagrecer:</b> déficit moderado (−300 a −500 kcal/dia)</li>
</ul>
<p>Use a calculadora de calorias na aba Aprender para ter uma estimativa.</p>
<h3>Água 💧</h3>
<p>Uma referência prática é <b>~35 ml por kg</b> por dia, mais nos dias quentes e de treino.</p>
<div class="callout">🩺 Para um plano alimentar individual, procure um(a) nutricionista.</div>`,
  },
  {
    id: 'descanso',
    emoji: '😴',
    cor: '#e4c1f9',
    titulo: 'Sono e recuperação',
    resumo: 'O músculo cresce no descanso.',
    html: `
<ul>
<li>Durma <b>7–9 horas</b> por noite. Pouco sono atrapalha força, fome e humor.</li>
<li>Deixe ~48 h antes de treinar pesado o mesmo músculo de novo.</li>
<li>Dias de descanso ativo (caminhada, alongamento, yoga) ajudam a recuperar.</li>
<li>Dor muscular tardia (DOMS) é normal no começo e diminui com o tempo. Ela <b>não</b> é sinal obrigatório de bom treino.</li>
</ul>`,
  },
  {
    id: 'iniciante',
    emoji: '🐣',
    cor: '#fde2e4',
    titulo: 'Primeiro mês na academia',
    resumo: 'Guia sem vergonha para iniciantes.',
    html: `
<ul>
<li><b>Semana 1–2:</b> foque em aprender os movimentos com carga leve. Ninguém está te julgando!</li>
<li><b>Semana 3–4:</b> comece a aumentar as cargas aos poucos e anote tudo.</li>
<li>Peça ajuda aos professores da academia para ajustar as máquinas.</li>
<li>Leve toalha e garrafinha de água. Devolva os pesos ao lugar 💕</li>
<li>Consistência &gt; perfeição. Treinar 3x por semana por um ano muda tudo.</li>
</ul>`,
  },
  {
    id: 'seguranca',
    emoji: '🩹',
    cor: '#a2d2ff',
    titulo: 'Segurança e dor',
    resumo: 'Quando parar e quando procurar ajuda.',
    html: `
<ul>
<li><b>Queimação muscular</b> durante a série é normal.</li>
<li><b>Dor aguda, pontada ou dor na articulação</b> não é. Pare o exercício.</li>
<li>Se a dor persistir por mais de alguns dias, procure um médico ou fisioterapeuta.</li>
<li>Tem alguma condição de saúde (pressão alta, cardiopatia, gestação, lesão)? Converse com um profissional de saúde antes de começar.</li>
</ul>
<div class="callout">⚠️ O Fofit é uma ferramenta educativa e não substitui a orientação de um profissional de educação física ou de saúde.</div>`,
  },
];

export const TIPS = [
  'Beba água! Desidratação de 2% já reduz o desempenho. 💧',
  'Consistência vence intensidade. Um treino ok feito vale mais que um treino perfeito pulado. ✨',
  'Anote seus pesos: o que é medido, melhora. 📒',
  'Durma bem hoje: é no descanso que o músculo cresce. 😴',
  'Proteína em todas as refeições ajuda na recuperação. 🍳',
  'Aqueça antes de pegar pesado. Seu corpo agradece! 🔥',
  'Técnica primeiro, carga depois. 🧠',
  'Respire: solte o ar na fase de esforço. 🌬️',
  'Comparar-se só com você mesmo(a) de ontem. 🌱',
  'Desça o peso devagar: a fase excêntrica também constrói músculo. 🐢',
  'Treinar perto da falha (1–3 reps na reserva) é o ponto ideal. 🎯',
  'Caminhar 7–10 mil passos por dia ajuda muito no emagrecimento. 👟',
];
