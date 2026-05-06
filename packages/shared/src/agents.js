/**
 * Catálogo completo de áreas, bancas e agentes disponíveis na plataforma.
 * Cada agente = combinação de uma ÁREA + uma BANCA.
 */

// ── Áreas de concurso ────────────────────────────────────────
export const AREAS = [
  {
    id: "tributario",
    name: "Tributário / Auditoria",
    icon: "📊",
    color: "#f5a623",
    cargos: ["Auditor Fiscal", "Técnico Tributário", "Analista Tributário", "Auditor TCE/TCU/CGU"],
    subjects: [
      "Direito Tributário", "Contabilidade Geral", "Contabilidade Pública",
      "Direito Financeiro", "Auditoria Governamental", "Lei de Responsabilidade Fiscal",
      "Direito Administrativo", "Raciocínio Lógico", "Língua Portuguesa", "Informática"
    ],
  },
  {
    id: "policial",
    name: "Policial",
    icon: "🚔",
    color: "#5b9ef8",
    cargos: ["Delegado", "Investigador", "Escrivão", "Perito", "Agente PF/PRF/PC/PM"],
    subjects: [
      "Direito Penal", "Processo Penal", "Direito Constitucional",
      "Direito Administrativo", "Criminologia", "Medicina Legal",
      "Criminalística", "Legislação Especial", "Língua Portuguesa", "Raciocínio Lógico"
    ],
  },
  {
    id: "judiciario",
    name: "Judiciário / Tribunais",
    icon: "⚖️",
    color: "#a78bfa",
    cargos: ["Analista Judiciário", "Técnico Judiciário", "Oficial de Justiça", "Escrivão Judicial"],
    subjects: [
      "Direito Civil", "Processo Civil", "Direito Constitucional",
      "Direito Administrativo", "Direito do Trabalho", "Processo do Trabalho",
      "Estatuto do Servidor", "Língua Portuguesa", "Raciocínio Lógico", "Informática"
    ],
  },
  {
    id: "legislativo",
    name: "Legislativo",
    icon: "🏛️",
    color: "#34d399",
    cargos: ["Analista Legislativo", "Técnico Legislativo", "Consultor", "Assessor"],
    subjects: [
      "Direito Constitucional", "Direito Administrativo", "Regimento Interno",
      "Processo Legislativo", "Direito Financeiro", "Controle Externo",
      "Língua Portuguesa", "Raciocínio Lógico", "Arquivologia", "Informática"
    ],
  },
  {
    id: "ministerio_publico",
    name: "Ministério Público",
    icon: "🔏",
    color: "#fc7171",
    cargos: ["Promotor de Justiça", "Analista MP", "Técnico MP"],
    subjects: [
      "Direito Constitucional", "Direito Penal", "Processo Penal",
      "Direito Civil", "Processo Civil", "Direito Administrativo",
      "Direito Eleitoral", "Língua Portuguesa", "Raciocínio Lógico"
    ],
  },
  {
    id: "procuradoria",
    name: "Procuradoria / Advocacia Pública",
    icon: "📜",
    color: "#fb923c",
    cargos: ["Procurador do Estado", "Procurador Municipal", "Advogado da União", "Defensor Público"],
    subjects: [
      "Direito Constitucional", "Direito Administrativo", "Direito Civil",
      "Processo Civil", "Direito Tributário", "Direito Financeiro",
      "Direito Internacional", "Língua Portuguesa", "Raciocínio Lógico"
    ],
  },
  {
    id: "regulatorio",
    name: "Agências Reguladoras",
    icon: "📡",
    color: "#22d3ee",
    cargos: ["Especialista", "Analista Administrativo", "Técnico Regulatório"],
    subjects: [
      "Direito Administrativo", "Direito Constitucional", "Regulação Econômica",
      "Direito Econômico", "Contabilidade", "Língua Portuguesa",
      "Raciocínio Lógico", "Noções de Economia", "Informática"
    ],
  },
  {
    id: "financeiro",
    name: "Banco Central / Finanças",
    icon: "🏦",
    color: "#facc15",
    cargos: ["Analista Banco Central", "Analista CVM/SUSEP", "Economista"],
    subjects: [
      "Economia", "Macroeconomia", "Finanças Públicas", "Direito Econômico",
      "Mercado de Capitais", "Contabilidade", "Estatística",
      "Raciocínio Lógico", "Língua Portuguesa", "Atualidades"
    ],
  },
  {
    id: "administrativo",
    name: "Gestão Pública / Administração",
    icon: "🗂️",
    color: "#86efac",
    cargos: ["Administrador", "Analista de Gestão", "Assistente Administrativo", "Técnico INSS"],
    subjects: [
      "Administração Geral", "Administração Pública", "Direito Administrativo",
      "Gestão de Pessoas", "Orçamento Público", "Arquivologia",
      "Língua Portuguesa", "Raciocínio Lógico", "Informática", "Atualidades"
    ],
  },
  {
    id: "saude",
    name: "Saúde Pública",
    icon: "🏥",
    color: "#f472b6",
    cargos: ["Médico", "Enfermeiro", "Farmacêutico", "Analista ANVISA/ANS"],
    subjects: [
      "Saúde Pública", "Epidemiologia", "Vigilância Sanitária",
      "Legislação SUS", "Bioética", "Gestão em Saúde",
      "Língua Portuguesa", "Raciocínio Lógico", "Ética no Serviço Público"
    ],
  },
];

// ── Bancas examinadoras ──────────────────────────────────────
export const BANCAS = [
  {
    id: "cespe",
    name: "CESPE / CEBRASPE",
    abbr: "CESPE",
    color: "#dc2626",
    style: "Certo/Errado e múltipla escolha. Cobra literalidade da lei e jurisprudência. Enunciados longos com pegadinhas sutis. Alta dificuldade.",
    tip: "Leia cada palavra. Generalizações absolutas (sempre/nunca/apenas) = quase sempre errado.",
  },
  {
    id: "fcc",
    name: "Fundação Carlos Chagas",
    abbr: "FCC",
    color: "#0284c7",
    style: "Múltipla escolha. Foco em doutrina e legislação seca. Cobra conceitos e classificações. Previsível e sistemática.",
    tip: "Decore os conceitos doutrinários. FCC ama enumerações e classificações dos livros.",
  },
  {
    id: "vunesp",
    name: "VUNESP",
    abbr: "VUNESP",
    color: "#7c3aed",
    style: "Múltipla escolha. Foco em jurisprudência dos tribunais superiores. Boa aplicação prática do direito.",
    tip: "Acompanhe STF e STJ. VUNESP cobra súmulas e informativos recentes.",
  },
  {
    id: "fgv",
    name: "FGV",
    abbr: "FGV",
    color: "#047857",
    style: "Múltipla escolha e discursiva. Alto nível. Cobra raciocínio jurídico, não só memorização. Questões inteligentes.",
    tip: "Entenda o fundamento, não decore. FGV quer que você raciocine.",
  },
  {
    id: "aocp",
    name: "Instituto AOCP",
    abbr: "AOCP",
    color: "#b45309",
    style: "Múltipla escolha. Literalidade da legislação. Cargo de nível médio-alto. Foco em textos legais exatos.",
    tip: "Leia a lei seca. AOCP copia trechos literais nas alternativas.",
  },
  {
    id: "ibfc",
    name: "IBFC",
    abbr: "IBFC",
    color: "#0e7490",
    style: "Múltipla escolha. Nível intermediário. Equilibra lei, doutrina e prática. Mais acessível que CESPE.",
    tip: "Base sólida em lei + doutrina básica. Sem grandes pegadinhas.",
  },
  {
    id: "quadrix",
    name: "QUADRIX",
    abbr: "QDRIX",
    color: "#4d7c0f",
    style: "Múltipla escolha. Parecida com CESPE em estilo. Cobra lei, regulamentos e atualidades do setor.",
    tip: "Foco em regulamentos específicos do órgão do concurso.",
  },
  {
    id: "idecan",
    name: "IDECAN",
    abbr: "IDECAN",
    color: "#9f1239",
    style: "Múltipla escolha. Nível médio. Cobra lei seca com enunciados diretos.",
    tip: "Siga a literalidade. Questões mais diretas, menos interpretativas.",
  },
];

// ── Helper: gera ID de agente ────────────────────────────────
export function agentId(areaId, bancaId) {
  return `${areaId}__${bancaId}`;
}

// ── Helper: busca área e banca por agentId ───────────────────
export function parseAgentId(id) {
  const [areaId, bancaId] = id.split("__");
  return {
    area:  AREAS.find(a => a.id === areaId)  || null,
    banca: BANCAS.find(b => b.id === bancaId) || null,
  };
}
