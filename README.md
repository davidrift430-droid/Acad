# 💖 Fofit — app de academia fofo e personalizado

App de celular (PWA) para academia: monta um **treino personalizado**, mostra **como fazer cada exercício com fotos**, registra séries e cargas, cronometra o descanso e acompanha sua **evolução**. Tudo em português, funcionando offline e com uma mascote fofa, a **Fofi**. 🩷

## ✨ Funcionalidades

| | |
|---|---|
| 🧠 **Treino personalizado** | Questionário (objetivo, nível, dias, tempo, local, ênfase muscular, dores) → gera o plano com divisão, exercícios, séries, repetições e descanso, e explica *por que* |
| 🧩 **Montar treino** | Editor para criar do zero: dias, exercícios, séries/reps/descanso, reordenar. Mais 8 modelos prontos (iniciante, glúteos, em casa, sem equipamento, força, PPL…) |
| 📸 **Como fazer** | 79 exercícios com fotos da posição inicial ↔ final em animação, passo a passo, dicas, erros comuns e alertas para joelho/lombar/ombro/punho |
| ⏱️ **Treino ao vivo** | Registro de kg × reps, mostra o que fez da última vez, sugere quando subir a carga (progressão dupla), descanso automático com som/vibração, trocar/adicionar exercícios, tela sempre acesa |
| 📈 **Progresso** | Volume semanal, treinos por semana, calendário, recordes pessoais (1RM estimado), gráfico por exercício, peso corporal, histórico e 16 conquistas |
| 🎓 **Aprender** | 10 guias (como montar treino, divisões, séries/reps, progressão, RIR, aquecimento, alimentação, sono, primeiro mês, segurança) |
| 🧮 **Calculadoras** | Calorias e proteína (Mifflin-St Jeor), IMC, 1RM com tabela de cargas, água |
| 🌙 **Extras** | Modo escuro, offline, backup/restauração, instalação na tela inicial |

## 🔬 Base científica do gerador

- **Frequência:** cada músculo ~2x por semana (full body com 2–3 dias, superiores/inferiores com 4, PPL com 5–6).
- **Volume:** 10–20 séries semanais por músculo; compostos primeiro, isolados depois.
- **Reps e descanso por objetivo:** massa 8–12 (90 s), força 4–6 (3 min), emagrecer 10–15 com cardio, condicionamento 12–20 (45 s).
- **Intensidade:** 1–3 repetições na reserva (RIR).
- **Progressão dupla:** completou o topo da faixa em todas as séries → sobe a carga.
- **Restrições:** exercícios que costumam incomodar regiões doloridas são evitados automaticamente.

Referências: posicionamentos do ACSM e revisões sobre hipertrofia/força (ex.: Schoenfeld et al.). Inspiração de UX: apps como Hevy, Strong e Fitbod (registro rápido, plano adaptativo).

## 📱 Como usar no celular

1. Publique (veja abaixo) e abra o link no celular.
2. **Android (Chrome):** menu ⋮ → *Instalar app*. **iPhone (Safari):** compartilhar ⬆️ → *Adicionar à Tela de Início*.
3. Pronto: abre em tela cheia como um app e funciona sem internet.

### Publicar grátis no GitHub Pages
Em **Settings → Pages → Source**, escolha **GitHub Actions**. A cada push na `main` o workflow `.github/workflows/pages.yml` roda os testes e publica.

### Rodar no computador
```bash
npm start          # serve em http://localhost:5173
npm test           # testa o gerador em 5.400 perfis diferentes
```
(Ou qualquer servidor estático, ex.: `python3 -m http.server`.)

### Quer na Play Store / App Store?
O app é um PWA sem build, então dá para empacotar com [Capacitor](https://capacitorjs.com/):
```bash
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init Fofit com.fofit.app --web-dir .
npx cap add android && npx cap open android
```
Ou gerar um APK direto do link publicado com o [PWABuilder](https://www.pwabuilder.com/).

## 🗂️ Estrutura

```
index.html, manifest.webmanifest, sw.js   # app shell, PWA e offline
css/app.css                               # visual (tema claro/escuro)
js/app.js                                 # rotas e barra de abas
js/generator.js                           # gerador de treino personalizado
js/store.js, js/stats.js, js/charts.js    # dados locais, estatísticas, gráficos SVG
js/data/exercises.js, js/data/guides.js   # biblioteca de exercícios e guias
js/views/*.js                             # telas
img/ex/                                   # fotos dos exercícios (WebP)
tests/generator.test.js                   # testes
```

Sem dependências e sem servidor: os dados ficam só no aparelho (localStorage).

## 📜 Créditos e aviso

- Fotos dos exercícios: [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (domínio público / Unlicense), convertidas para WebP.
- Fonte: Nunito (Google Fonts).
- O Fofit é uma ferramenta educativa e **não substitui** a orientação de profissionais de educação física, nutrição ou saúde.
