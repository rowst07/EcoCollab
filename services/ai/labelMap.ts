// services/ai/labelsMap.ts
export type TipoResiduo = 'vidro' | 'papel' | 'plastico' | 'metal' | 'pilhas' | 'organico';

type KeywordMap = { keywords: string[]; tipo: TipoResiduo; weight?: number };

export function norm(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const kw = (arr: string[]) => norm(arr.join(' ')).split(' ');

export const LABELS: KeywordMap[] = [
  { tipo: 'papel',    keywords: kw(['papel','jornais','revista','guardanapo','livro','caderno','folha','cartao','papelao','paper','newspaper','magazine','tissue','book','notebook','sheet','cardboard','carton']) },
  { tipo: 'vidro',    keywords: kw(['garrafa','garrafas','frasco','frascos','vidro','boiao','wine bottle','beer bottle','jar','glass']) },
  { tipo: 'plastico', keywords: kw(['plastico','saco','embalagem','garrafa plastico','garrafao','pacote','embrulho','pelicula','tampa plastica','plastic','packet','wrapping','bag','water bottle','plastic bottle','cap']) },
  { tipo: 'metal',    keywords: kw(['lata','latas','aluminio','aco','metal','conserva','can','tin','aluminum','steel','metal']) },
  { tipo: 'pilhas',   weight: 1.2, keywords: kw(['pilha','pilhas','bateria','baterias','acumulador','battery','batteries','accumulator']) },
  { tipo: 'organico', weight: 0.9, keywords: kw(['restos','comida','alimento','organico','casca','banana','maca','laranja','pao','salada','vegetal','fruta','borra cafe','food','banana','apple','orange','peel','vegetable','fruit','bread','coffee grounds']) },
];

// mapeia um rótulo do modelo (EN) para tipo EcoCollab
export function mapLabel(label: string): { tipo: TipoResiduo | null; score: number } {
  const tokens = norm(label).split(/\s+/).filter(Boolean);
  // heurística para vidro vs plástico quando vier "bottle"
  const isBottle = tokens.includes('bottle');
  const saysGlass = tokens.includes('glass') || tokens.includes('wine') || tokens.includes('beer');
  const saysPlastic = tokens.includes('plastic') || tokens.includes('water');

  if (isBottle && (saysGlass || saysPlastic)) {
    if (saysGlass) return { tipo: 'vidro', score: 1.1 };
    if (saysPlastic) return { tipo: 'plastico', score: 1.1 };
  }

  let best: { tipo: TipoResiduo | null; score: number } = { tipo: null, score: 0 };
  for (const item of LABELS) {
    const hit = tokens.some(t => item.keywords.includes(t));
    if (hit) {
      const s = (item.weight ?? 1);
      if (s > best.score) best = { tipo: item.tipo, score: s };
    }
  }
  return best;
}
