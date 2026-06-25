import { Router } from "express";
import { z } from "zod";
import { query, audit } from "../db.ts";
import { requireAdmin } from "../auth.ts";

export const mospRouter = Router();

interface MospRow {
  id: string;
  title: string;
  order: number;
  triggers: string[];
  content_md: string;
  created_at: string;
  updated_at: string;
}

function toMemory(r: MospRow) {
  return {
    id: r.id,
    title: r.title,
    order: r.order,
    triggers: r.triggers,
    contentMd: r.content_md,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

mospRouter.get("/mosp", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const like = q ? `%${q}%` : null;
    const { rows } = await query<MospRow>(
      `SELECT * FROM mosp_memories
       WHERE ($1::text IS NULL OR title ILIKE $1 OR content_md ILIKE $1)
       ORDER BY "order" ASC, title ASC`,
      [like],
    );
    res.json(rows.map(toMemory));
  } catch (err) {
    next(err);
  }
});

const memSchema = z.object({
  title: z.string().trim().min(1),
  order: z.number().int().optional(),
  triggers: z.array(z.string()).optional(),
  contentMd: z.string().optional(),
});

mospRouter.post("/mosp", requireAdmin, async (req, res, next) => {
  try {
    const parsed = memSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    const { title, order, triggers, contentMd } = parsed.data;
    const { rows } = await query<MospRow>(
      `INSERT INTO mosp_memories (title, "order", triggers, content_md)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, order ?? 100, triggers ?? [], contentMd ?? ""],
    );
    await audit("CREATE", "mosp", rows[0].id, title, req.user?.email);
    res.status(201).json(toMemory(rows[0]));
  } catch (err) {
    next(err);
  }
});

mospRouter.patch("/mosp/:id", requireAdmin, async (req, res, next) => {
  try {
    const parsed = memSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Payload inválido." });
    const { title, order, triggers, contentMd } = parsed.data;
    const { rows } = await query<MospRow>(
      `UPDATE mosp_memories SET
         title = COALESCE($2, title),
         "order" = COALESCE($3, "order"),
         triggers = COALESCE($4, triggers),
         content_md = COALESCE($5, content_md),
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, title ?? null, order ?? null, triggers ?? null, contentMd ?? null],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Memória não encontrada." });
    await audit("UPDATE", "mosp", req.params.id, null, req.user?.email);
    res.json(toMemory(rows[0]));
  } catch (err) {
    next(err);
  }
});

mospRouter.delete("/mosp/:id", requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM mosp_memories WHERE id = $1`, [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Memória não encontrada." });
    await audit("DELETE", "mosp", req.params.id, null, req.user?.email);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Padrões clínicos pré-carregados ("Semear Padrões do App").
const SEED: Array<{ title: string; order: number; triggers: string[]; contentMd: string }> = [
  {
    title: "Risco Suicida",
    order: 10,
    triggers: ["suicíd", "suicid", "ideação", "morte", "se matar", "autoextermínio"],
    contentMd:
      "# Risco Suicida\n\n- **Sempre** investigar ativamente ideação, plano, intenção, acesso a meios e tentativas prévias.\n- Considerar aplicar a **C-SSRS**.\n- Avaliar fatores de risco (desesperança, dor psíquica, impulsividade, perdas recentes, uso de substâncias) e de proteção (suporte, vínculos, razões para viver).\n- Definir nível de risco e conduta (segurança imediata, restrição de meios, intensificação do cuidado, internação se necessário).\n- Documentar a avaliação e o plano de segurança.",
  },
  {
    title: "Psicose",
    order: 20,
    triggers: ["psicose", "psicótic", "delírio", "alucinaç", "esquizofren"],
    contentMd:
      "# Psicose\n\n- Caracterizar sintomas positivos (delírios, alucinações, desorganização) e negativos.\n- Excluir causas orgânicas e induzidas por substâncias.\n- Avaliar risco (auto/heteroagressão), insight e adesão.\n- Considerar escalas (PANSS/BPRS).\n- Planejar antipsicótico com atenção a efeitos adversos e monitorização metabólica.",
  },
  {
    title: "Mania / Hipomania",
    order: 30,
    triggers: ["mania", "maníac", "hipomania", "bipolar", "eufor"],
    contentMd:
      "# Mania / Hipomania\n\n- Critérios: humor elevado/irritável + aumento de energia/atividade por período definido.\n- Investigar redução da necessidade de sono, grandiosidade, fuga de ideias, impulsividade, gastos excessivos.\n- **Cuidado com antidepressivos** (risco de virada/ciclagem).\n- Considerar escalas (YMRS/Altman).\n- Avaliar risco e necessidade de estabilizador do humor/antipsicótico.",
  },
  {
    title: "Catatonia",
    order: 40,
    triggers: ["catatonia", "catatônic", "estupor", "negativismo", "flexibilidade cérea"],
    contentMd:
      "# Catatonia\n\n- Sinais: imobilidade/estupor, mutismo, negativismo, posturas, flexibilidade cérea, ecolalia/ecopraxia, agitação.\n- Considerar **teste com lorazepam** (resposta diagnóstica/terapêutica).\n- Investigar causa de base (psiquiátrica e orgânica).\n- Atenção a complicações clínicas (desidratação, TVP, rabdomiólise).\n- ECT em casos graves/refratários.",
  },
  {
    title: "Abstinência Alcoólica",
    order: 50,
    triggers: ["álcool","alcool","etíli","etilis","abstinência","abstinencia","ciwa","tremor","delirium","convuls","wernicke","tiamina"],
    contentMd: "# Abstinência Alcoólica\n\n- **Guiar por CIWA-Ar (10 itens), seriada a cada 1–4h** durante a desintoxicação em todo paciente em risco (uso pesado, último uso recente). A **tendência** (subindo/caindo) orienta o desmame.\n- **BZD sintomático guiado por escore — tratar geralmente com CIWA-Ar ≥8–10**; esquema sintomático ou de dose fixa com desmame.\n- **Escore >20 sinaliza risco de convulsão e delirium tremens** → intensificar tratamento e vigilância.\n- **BZD de escolha:** diazepam ou lorazepam; **preferir lorazepam no hepatopata/idoso** (sem metabólito hepático ativo).\n- **Tiamina 300 mg/dia (parenteral nos casos graves) ANTES da glicose** — profilaxia de encefalopatia de Wernicke.\n- **Repor magnésio.**\n- Diante de confusão aguda, aplicar **CAM**: delirium é causa orgânica — buscar/corrigir etiologia, não medicar como psicose.\n- **Evitar bupropiona** (reduz o limiar convulsivo) na abstinência alcoólica.",
  },
  {
    title: "Abstinência de Opioides (COWS)",
    order: 55,
    triggers: ["opioide","opiáce","opiác","heroín","cows","buprenorfina","buprenorfina/naloxona","metadona","naltrexona","abstinência de opioide"],
    contentMd: "# Abstinência de Opioides (COWS)\n\n- **COWS** mede a gravidade da abstinência de opioides por sinais predominantemente objetivos (11 itens); aplicar diante de suspeita de abstinência. É **essencial antes de iniciar buprenorfina**.\n- **Iniciar buprenorfina apenas com abstinência leve-moderada já instalada — geralmente COWS ≥8–12** — para evitar **abstinência precipitada** (não iniciar com paciente ainda sob efeito do opioide).\n- Buprenorfina/naloxona e metadona são as opções de **terapia de substituição** (programas regulamentados).\n- **Sintomáticos** conforme a intensidade: **clonidina, antieméticos e analgésicos**.\n- **Naltrexona** (antagonista opioide; 50 mg/dia VO ou 380 mg IM/mês) para manutenção/anticraving **exige 7–10 dias sem opioide** — risco de abstinência precipitada; checar função hepática.\n- **Metadona prolonga o QTc**: avaliar QTc antes e durante o uso; corrigir K⁺/Mg²⁺ e revisar fármacos prolongadores.",
  },
  {
    title: "Manutenção / Anticraving",
    order: 60,
    triggers: ["naltrexona","acamprosato","dissulfiram","anticraving","craving","fissura","manuten","abstin","anti-craving","anti craving"],
    contentMd: "# Manutenção / Anticraving (álcool e opioides)\n\n- **Naltrexona** 50 mg/dia VO **ou** 380 mg IM/mês — álcool e opioides. Antagonista opioide: **exige 7–10 dias sem opioide** (risco de abstinência precipitada). **Checar função hepática.**\n- **Acamprosato** 666 mg 3x/dia — álcool. **Ajustar na insuficiência renal**; boa opção na manutenção da abstinência.\n- **Dissulfiram** 250 mg/dia — álcool (aversivo). Provoca reação se houver ingestão de álcool; **exige adesão e abstinência prévia**.\n- Escolha pelo perfil: naltrexona se craving/uso opioide associado; acamprosato priorizando manutenção (atenção à IR); dissulfiram apenas em paciente aderente e já abstinente.\n- Naltrexona é **contraindicada com opioide ativo** — confirmar janela de 7–10 dias antes de iniciar.\n- Estes fármacos são para **manutenção/anticraving**, não para o manejo agudo da abstinência alcoólica (esse usa BZD guiado por CIWA-Ar + tiamina).",
  },
  {
    title: "Rastreio e Gravidade do TUS",
    order: 65,
    triggers: ["uso de substância","uso de substancia","dependência","dependencia","álcool","alcool","etilis","cocaína","cocaina","crack","audit","assist","cage","fagerström","fagerstrom","droga","substância","substancia","fissura","craving","abstinência","abstinencia","tus","opioide","maconha","tabac","nicotina","benzodiazepín","dsm-5","dependência química","tolerância","recaída"],
    contentMd: "# Rastreio e Gravidade do TUS\n\n- **Detalhar CADA substância em tabela**: idade de início, via, dose/quantidade, frequência, último uso e padrão atual. Cobrir álcool (UI/dia), tabaco/nicotina (cig/dia), maconha/THC, cocaína/crack (aspirada/fumada/EV), estimulantes, opioides, benzodiazepínicos, solventes, alucinógenos, NPS/GHB. O **tempo desde o último uso de cada substância define o risco de abstinência aguda**.\n- **Caracterizar o transtorno (DSM-5-TR)**: identificar a \"droga de escolha\" (substância de maior impacto). Gravidade pelo número de critérios presentes — **2–3 = leve, 4–5 = moderado, ≥6 = grave** (controle prejudicado, uso apesar de prejuízo, comprometimento social, critérios farmacológicos).\n- **Avaliar os 4 eixos farmacológicos/comportamentais**: tolerância (descrever); síndrome de abstinência já apresentada (tremor, convulsão, delirium, sudorese); fissura/craving (intensidade, gatilhos, frequência); comportamentos de risco (uso EV, compartilhar seringas, sexo sob efeito, dirigir intoxicado, overdoses prévias — nº, naloxona/UTI).\n- **AUDIT (álcool) define a intervenção**: **8–15 → intervenção breve**; **16–19 → intervenção intensa/aconselhamento**; **≥20 → avaliação e tratamento de dependência** (encaminhamento estruturado). CAGE ≥2 positivo → aprofundar com AUDIT.\n- **Aplicar instrumentos padronizados e anexar escores**: ASSIST (rastreio multissubstância OMS), Fagerström/FTND (dependência de nicotina, orienta intensidade da farmacoterapia), e estágio motivacional de Prochaska & DiClemente (pré-contemplação → manutenção).\n- **Sinalizar risco de abstinência grave para monitorização seriada**: álcool e benzodiazepínicos → CIWA-Ar (convulsão/delirium tremens; >20 = risco alto); opioides → COWS (essencial antes de iniciar buprenorfina, geralmente ≥8–12).\n- **História de tratamento prévio**: internações anteriores (nº, desfecho), maiores períodos de abstinência e o que os sustentou, recaídas (nº, gatilhos, padrão), grupos (AA/NA, CAPS-AD), farmacoterapia prévia e resposta.",
  },
  {
    title: "Diagnóstico Duplo (Primário vs Induzido)",
    order: 70,
    triggers: ["diagnóstico duplo","comorbidade","induzido","reavaliar","primário","abstinência","humor","psicose","dupla","substância"],
    contentMd: "# Diagnóstico Duplo: Primário vs Induzido\n\n- **Não fixe o diagnóstico psiquiátrico na admissão.** Humor, psicose, ansiedade que surgem em intoxicação/abstinência podem ser induzidos por substância. Registrar como hipótese \"a reavaliar\" e programar reavaliação diagnóstica após período de abstinência (campos 13 da anamnese / nota de admissão).\n- **Sequência correta:** primeiro desintoxicar e estabilizar (manejo da abstinência guiado por CIWA-Ar/COWS), depois reavaliar o componente afetivo/psicótico — só então confirmar primário vs induzido e definir farmacoterapia da comorbidade.\n- **Não empilhe psicofármacos no agudo.** Evitar iniciar antidepressivo/antipsicótico de manutenção para sintomas que podem resolver com a abstinência; o que persiste após estabilização é que sustenta o diagnóstico primário.\n- **Reavaliação programada na evolução:** seriar humor/psicose (ex.: reavaliar humor em 48–72h, conforme SOAP) e marcar como pendência diagnóstica ativa até a abstinência permitir distinguir.\n- **Antes de assumir depressão resistente (DRT):** rever o diagnóstico — bipolaridade oculta, hipotireoidismo, **substâncias** e causa orgânica — antes de combinar/potencializar antidepressivos.\n- **Apoio diagnóstico:** história familiar (TUS e transtornos psiquiátricos em 1º grau), episódios prévios independentes do uso e cronologia (sintoma precede ou só ocorre durante o uso?) ajudam a separar primário de induzido.\n- **No sumário de alta, dar status final:** componente de humor/psicose \"primário confirmado\" (iniciar/manter fármaco) ou \"induzido resolvido\" (suspender) — só medicar de forma duradoura o que se confirmou primário.\n- **Segurança não silenciosa:** manter flags de risco (suicídio, abstinência grave, evasão) mesmo com quadro aparentemente normalizado durante a reavaliação.",
  },
  {
    title: "Delirium (CAM)",
    order: 75,
    triggers: ["delirium","confus","confuso","desorient","cam","flutuante","obnubil","agudo","consciência","desaten"],
    contentMd: "# Delirium (CAM)\n\n- **CAM positivo** exige: início agudo/flutuante **+** desatenção **+** (pensamento desorganizado **ou** alteração do nível de consciência). É o instrumento que **muda a rota**.\n- Aplicar diante de qualquer **alteração aguda** de comportamento/cognição, sobretudo em idoso, pós-operatório, intoxicação/abstinência ou quadro confusional.\n- Positivo = **causa orgânica**, NÃO quadro psiquiátrico primário: buscar e corrigir a etiologia (infecção, metabólico, fármacos, abstinência).\n- **Revisar medicações deliriogênicas** e instituir medidas ambientais.\n- **Erro grave a evitar:** medicar como psicose um delirium subjacente.\n- Se contexto de abstinência alcoólica, lembrar **tiamina antes de glicose** e correlacionar com CIWA-Ar (>20 sinaliza risco de convulsão/delirium tremens).",
  },
  {
    title: "Antipsicóticos — Monitorização e EPS",
    order: 80,
    triggers: ["antipsicótic","neuroléptic","clozapina","olanzapina","quetiapina","risperidona","haloperidol","aripiprazol","acatisia","discinesia","extrapiramidal","eps","distonia","parkinsonismo","agranulocitose","hemograma","anc","síndrome metabólic","aims","barnes","simpson-angus","biperideno","vmat2","qtc"],
    contentMd: "# Antipsicóticos — Monitorização e EPS\n\n- **Síndrome metabólica (peso, glicemia, lipídios):** monitorar basal e periódico, sobretudo **olanzapina, clozapina, quetiapina** (mais metabólicos). Lurasidona/aripiprazol têm perfil mais leve.\n- **Clozapina:** uso em refratariedade — **hemograma/ANC seriado obrigatório** (agranulocitose); titular lentamente (12,5 mg → ~25–50 mg/dia). Vigiar também miocardite, convulsão, sialorreia, íleo.\n- **EPS — distonia aguda / parkinsonismo** (Simpson-Angus média >0,3): **biperideno 2 mg VO/IM** e/ou reduzir/trocar o antipsicótico (por um de menor risco). Mais com típicos e risperidona.\n- **Acatisia (Barnes):** **reduzir dose ou trocar** o antipsicótico + **propranolol 20–40 mg** (eventualmente BZD). **NÃO confundir com agitação psicótica** — erro perigoso é aumentar o antipsicótico, que piora a acatisia e o risco de suicídio associado.\n- **Discinesia tardia (AIMS):** aplicar basal e a cada 3–6 meses (pode ser irreversível). Detectada → **reduzir/trocar** antipsicótico + **inibidor de VMAT2**.\n- **QTc (Bazett/Fridericia):** medir antes e durante (ziprasidona, haloperidol IV; pior em distúrbio eletrolítico/polifarmácia). Prolongado → corrigir K⁺/Mg²⁺, revisar fármacos; **QTc >500 ms ou ΔQTc >60 ms → suspender o agente** (risco de torsades).\n- **SNM (síndrome neuroléptica maligna):** emergência — suspender antipsicótico, suporte, dantrolene/bromocriptina.",
  },
  {
    title: "Estabilizadores de Humor",
    order: 85,
    triggers: ["lítio","litio","litemia","valproato","divalproato","ácido valproico","lamotrigina","carbamazepina","estabilizador","estabilizadores de humor","stevens-johnson","sjs"],
    contentMd: "# Estabilizadores de Humor\n\n- **Lítio — alvos:** litemia 0,8–1,2 mEq/L (agudo) / 0,6–0,8 (manutenção). Início 300 mg, titular por litemia (dosar 5 dias após ajuste). Efeito antissuicídio.\n- **Lítio — janela estreita / toxicidade:** monitorar **função renal e TSH**; tremor, poliúria, hipotireoidismo; **toxicidade quando >1,5 mEq/L**.\n- **Valproato/Divalproato:** alvo sérico 50–125 µg/mL (~20–30 mg/kg/dia). Monitorar transaminases e plaquetas. **Teratogênico — evitar em mulher em idade fértil sem contracepção confiável.**\n- **Valproato + lamotrigina:** valproato **dobra os níveis de lamotrigina** → titular ainda mais lento e reduzir dose-alvo (iniciar 25 mg em dias alternados).\n- **Lamotrigina — segurança/SJS:** titular MUITO lento por risco de Stevens-Johnson — 25 mg/dia × 2 sem → 50 mg/dia × 2 sem → 100 mg/dia × 1 sem → 200 mg/dia. Reiniciar titulação se interrupção >5 dias. Monitorar rash.\n- **Lamotrigina — indicação:** depressão bipolar e manutenção; **NÃO usar para mania aguda**. Sem nível sérico (alvo clínico). Com indutor (carbamazepina): dobrar a dose.\n- **Carbamazepina:** alvo 4–12 µg/mL; **indutor enzimático** (reduz contraceptivos e outros fármacos); hiponatremia, discrasias; **HLA-B*1502 → risco de SJS**.",
  },
  {
    title: "Depressão Resistente (DRT)",
    order: 90,
    triggers: ["depress","resistente","refratári","antidepressivo","augmentation","potencializ","drt"],
    contentMd: "# Depressão Resistente (DRT) — antes de empilhar fármacos\n\n- **Confirmar DRT verdadeira antes de combinar/potencializar:** exige ≥2 antidepressivos em dose e tempo adequados (6–8 semanas cada).\n- **Checklist obrigatório:** confirmar adesão (a \"resistência\" mais comum é não tomar); rever diagnóstico (bipolaridade oculta, hipotireoidismo, abuso de substâncias, causa orgânica); otimizar/subir a dose do atual antes de adicionar segundo fármaco.\n- **Augmentation — 1ª escolha aripiprazol** 2,5–15 mg/dia (iniciar 2,5–5 mg): melhor evidência entre os atípicos, aprovado como adjuvante.\n- **Augmentation consolidadas:** lítio 600–900 mg/dia (litemia-alvo ~0,6–0,8; mais evidência histórica) · T3/liotironina 25–50 mcg/dia (clássica, barata, acelera resposta) · OFC olanzapina 5–12,5 mg + fluoxetina 20–50 mg (aprovado p/ DRT e depressão bipolar).\n- **Quetiapina** é 2ª linha atrás do aripiprazol pelo ônus metabólico: 25–50 mg (sedação/insônia) ou 150–300 mg (efeito antidepressivo).\n- **Combinações de antidepressivos:** sertralina 50–200 + bupropiona XL 150–300 (energia/função sexual); venlafaxina XR 75–225 + mirtazapina 15–45 (\"California Rocket Fuel\"); escitalopram 10–20 + mirtazapina 15–45 (sono/apetite).\n- **Bupropiona — alertas:** rebaixa limiar convulsivo (contraindicada em epilepsia e transtornos alimentares); inibidor potente de CYP2D6.\n- **Opção moderna:** escetamina intranasal / cetamina mudou o algoritmo da DRT — uso em serviço com monitorização.\n- **Monitorizar:** lítio (litemia + função renal e tireoidiana); atípicos (perfil metabólico: peso, glicemia, lipídios).",
  },
  {
    title: "Risco de Heteroagressividade (Brøset)",
    order: 95,
    triggers: ["heteroagress","agressiv","agitaç","agitado","violênc","broset","brøset","bvc","agress","ameaça"],
    contentMd: "# Risco de Heteroagressividade (Brøset/BVC)\n\n- **Instrumento:** Brøset (BVC) estima a probabilidade de agressão nas **próximas 24h** por 6 comportamentos observáveis: confuso, irritável, barulhento, ameaça verbal, ameaça física, ataca objetos.\n- **Quando aplicar:** pacientes agitados, psicóticos ou intoxicados na enfermaria; **reavaliar a cada plantão**.\n- **Escore 0:** observação de rotina.\n- **Escore 1–2 (medidas preventivas):** desescalada verbal, ajuste de ambiente, observação mais próxima.\n- **Escore ≥3 (medidas imediatas):** mobilizar a equipe, reduzir estímulos e considerar **contenção química/física conforme protocolo**.\n- **Lógica:** o escore escalona a resposta da equipe para **antecipar a crise em vez de reagir a ela**.\n- Escore objetiva e seria a decisão, mas não substitui o julgamento clínico.",
  },
  {
    title: "Internação Psiquiátrica (Lei 10.216/2001)",
    order: 100,
    triggers: ["internação","internaç","involuntár","voluntár","compulsór","10.216","ministério público","mp","laudo","termo de consentimento","judicial"],
    contentMd: "# Internação Psiquiátrica (Lei 10.216/2001)\n\n- Registrar a **modalidade** na nota de admissão: **voluntária** (com termo de consentimento assinado) / **involuntária** (a pedido de terceiro + laudo médico) / **compulsória** (por determinação judicial).\n- Identificar **solicitante/responsável legal** (parentesco/vínculo) e, na compulsória, anexar a determinação judicial com o nº do processo.\n- **Internação involuntária → comunicar ao Ministério Público em até 72h** e emitir laudo médico de internação.\n- **Documentar a fundamentação clínica** da indicação: risco à vida / risco a terceiros / incapacidade de autocuidado / falência do tratamento ambulatorial.\n- Anexar/registrar a peça medicolegal correspondente: termo de consentimento (voluntária) **ou** laudo involuntário + comunicação ao MP **ou** determinação judicial; registrar termo de ciência da família e inventário de pertences.\n- Em internação involuntária, atentar para **risco de fuga/evasão** ao definir vigilância e conduta de segurança.\n- **Na alta de internação involuntária, comunicar o Ministério Público.**",
  },
  {
    title: "Tabagismo (Fagerström)",
    order: 105,
    triggers: ["tabagis","nicotin","fumant","tabaco","cigarro","fagerstr","vareniclin","bupropion","cessa","parar de fumar"],
    contentMd: "# Tabagismo\n\n- **Fagerström (FTND)** mede o grau de dependência de nicotina; aplicar em tabagistas ao planejar a cessação. O grau orienta a **intensidade da farmacoterapia**.\n- **Vareniclina** (agonista parcial nicotínico): 0,5 mg/dia → 0,5 mg 2x → 1 mg 2x. **Iniciar 1–2 semanas antes da data de parar.**\n- **Bupropiona** (150 mg → 300 mg): ajuda no tabagismo, mas **↓ limiar convulsivo** — evitar em epilepsia, bulimia/anorexia e abstinência alcoólica.\n- **Reposição de nicotina** (adesivo/goma/pastilha): **combinável** entre apresentações e com as demais opções.\n- **Dependência alta (Fagerström)** → reposição de nicotina combinada e/ou vareniclina/bupropiona, com **suporte mais intensivo**.",
  },
  {
    title: "TOC",
    order: 110,
    triggers: ["toc","obsess","compuls","y-bocs","ybocs","clomipramina","ritual"],
    contentMd: "# TOC (farmacologia distinta da ansiedade)\n\n- **ISRS em DOSE ALTA** é a base: ex. sertralina até 200 mg/dia, escitalopram até 20 mg/dia.\n- **Trials longos**: aguardar **10–12 semanas** em dose otimizada antes de julgar resposta.\n- **Refratário → potencializar com antipsicótico** (aripiprazol ou risperidona) **ou trocar para clomipramina**.\n- Benzodiazepínico e **pregabalina NÃO** são estratégia para TOC (são para TAG, não para TOC).\n- Separar do manejo de ansiedade/TAG: a abordagem farmacológica do TOC é diferente (dose mais alta, trial mais longo).",
  },
];

mospRouter.post("/mosp/seed", requireAdmin, async (req, res, next) => {
  try {
    let inserted = 0;
    for (const m of SEED) {
      const { rowCount } = await query(
        `INSERT INTO mosp_memories (title, "order", triggers, content_md)
         SELECT $1, $2, $3, $4
         WHERE NOT EXISTS (SELECT 1 FROM mosp_memories WHERE title = $1)`,
        [m.title, m.order, m.triggers, m.contentMd],
      );
      inserted += rowCount ?? 0;
    }
    await audit("CREATE", "mosp", null, `seed (${inserted})`, req.user?.email);
    res.json({ inserted });
  } catch (err) {
    next(err);
  }
});
