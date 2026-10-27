# NPL_TO_GRAPHITI_CONTEXT_PACKET_SPEC.md

Status:
SPEC_FUTURE

Authority:
KX108_ONLY

Runtime Status:
SPEC_ONLY

Decision Status:
NON_SOVEREIGN

Memory Write Status:
FORBIDDEN

Graphiti Write Status:
FORBIDDEN

Scope:
Définir le packet readonly produit par NPL sans décision ni écriture mémoire.

Source Material:
- Texte interne : logique humaine = culture compressée + récit dominant + mémoire sélectionnée + langage encodé.
- Analyse Obsidia : NPL est une couche readonly de provenance narrative, non souveraine.
- Recherche externe : Berger/Luckmann, Lakoff/Johnson, Foucault, Gramsci, Trouillot, Halbwachs/Assmann, Scott, Said, Spivak, Kuhn comme références non souveraines.

Definition:
Spécification du composant NPL TO GRAPHITI CONTEXT PACKET SPEC dans la couche NPL.

Purpose:
Définir le packet readonly produit par NPL sans décision ni écriture mémoire.

Allowed:
- Produire des hypothèses de provenance narrative.
- Produire des ContextPacket ou NarrativeProvenancePacket readonly.
- Alimenter plus tard Graphiti, Tree34, OS Trad, Brody ou Reverse OS en mode advisory-only.
- Signaler archive_gap, truth_regime, hidden_transcript, naturalization_pressure, official_language_frame.

Forbidden:
- Émettre ALLOW / HOLD / BLOCK.
- Émettre ACT.
- Écrire Graphiti, Neo4j ou mémoire persistante.
- Déclarer une vérité historique finale.
- Dire vainqueur = faux ou vaincu = vrai.
- Remplacer X-108 ou devenir autorité de décision.

Inputs:
- Human claim, phrase, reasoning, story, archive, silence, symbolic residue, or cultural narrative.
- Optional source metadata: speaker, institution, archive, language, date, transmission chain.
- Optional counter-source metadata: oral memory, defeated memory, hidden transcript, counter-archive.

Outputs:
- NarrativeProvenancePacket readonly.
- ContextPacket readonly.
- Provenance hypothesis only.
- No final truth verdict.

Metrics:
- `archive_gap_signal_score`
- `claim_provenance_confidence`
- `common_sense_capture_score`
- `cultural_matrix_score`
- `defeated_memory_signal_score`
- `dominant_narrative_likelihood`
- `external_power_gaze_score`
- `hidden_transcript_likelihood`
- `narrative_conflict_score`
- `source_asymmetry_score`
- `truth_regime_confidence`
- `winner_narrative_bias_score`

Invariants:
- NPL ↛ ACT
- NPL ↛ ALLOW
- NPL ↛ HOLD
- NPL ↛ BLOCK
- NPL ↛ truth_final
- NPL ↛ historical_truth_final
- NPL ↛ historical_verdict_final
- NPL ↛ moral_verdict
- NPL ↛ victim_truth
- NPL ↛ winner_falsehood
- NPL ↛ defeated_truth
- NPL ↛ archive_gap_proof
- NPL ↛ myth_truth
- NPL ↛ naturalization_falsehood
- NPL ↛ official_language_falsehood
- NPL ↛ memory_write
- NPL ↛ graphiti_write
- NPL ↛ neo4j_write
- NPL ↛ kernel_mutation
- NPL → provenance_hypothesis_only
- NPL → ContextPacket readonly
- NPL → NarrativeProvenancePacket readonly
- Decision = KX108_ONLY

X108 Boundary:
- X-108 remains the only final decision authority.
- This file cannot authorize ACT, ALLOW, HOLD, BLOCK, write, mint, transfer, execute, or kernel mutation.
- Any later action derived from NPL context must pass through X-108 via a separate DecisionTicket.
- NPL emits provenance hypotheses only.

Packet Fields:
- `packet_type`
- `claim`
- `apparent_logic`
- `cultural_matrix`
- `language_encoding`
- `truth_regime`
- `dominant_narrative_possible`
- `winner_narrative_bias_possible`
- `archive_gap_signal`
- `hidden_transcript_possible`
- `defeated_memory_possible`
- `external_power_gaze`
- `represented_by_self`
- `forced_translation_risk`
- `metaphor_matrix`
- `source_asymmetry_score`
- `common_sense_capture_score`
- `claim_provenance_confidence`
- `memory_fragmentation_score`
- `counter_archive_presence_score`
- `narrative_custody_chain`
- `who_benefits_if_true`
- `lost_futures_signal`
- `naturalization_detected`
- `autonym_exonym_gap`
- `official_language_frame`
- `counter_archive_quality_score`
- `myth_as_memory_signal`
- `victimhood_capture_risk`
- `time_depth_confidence`
- `narrative_time_depth_score`
- `custody_break_count`
- `official_vs_self_naming_conflict_score`
- `readonly`
- `advisory_only`
- `emits_act`
- `emits_verdict`
- `memory_write`
- `graphiti_write`
- `neo4j_write`
- `decision_authority`

Tests Required:
- Verify `NPL_TO_GRAPHITI_CONTEXT_PACKET_SPEC.md` contains Status, Authority, Metrics, Invariants, and X108 Boundary.
- Verify no field grants decision authority.
- Verify packet examples keep readonly=true, advisory_only=true, emits_act=false, emits_verdict=false.
- Verify claim-scope prohibits historical truth finalization.
- Verify external references are not treated as proof authority.

Proof Expected:
- No Lean proof expected in V1.
- Future proof target: machine-check non-sovereignty, no-ACT, no-write, no-verdict boundaries if integrated.
- Current proof level: SPEC_ONLY with audit-ready contracts.

Claim-Scope Notes:
- Allowed claim: NPL is a future readonly specification for narrative provenance.
- Forbidden claim: NPL is implemented, runtime-active, Sigma-active, Graphiti-writing, historically truth-deciding, or formally proven.
- NPL ne décide pas quel récit est vrai.
- NPL expose depuis quelle chaîne narrative un récit semble parler.
- Une logique humaine ne doit pas seulement être auditée par son contenu, mais par la chaîne narrative qui lui a donné le droit d’apparaître comme logique.

Open Questions:
- Which existing Obsidia modules already cover part of this concept: Tree34, Graphiti, Brody, OS Trad, Reverse OS?
- Should this file stay annexed or enter Plan 2 after Claude audit?
- Which metrics are redundant with existing Graphiti/Tree34/Brody metrics?

## Packet JSON Canonical Example

```json
{
  "packet_type": "NarrativeProvenancePacket",
  "claim": "",
  "apparent_logic": "",
  "cultural_matrix": [],
  "language_encoding": [],
  "truth_regime": "",
  "dominant_narrative_possible": false,
  "winner_narrative_bias_possible": false,
  "archive_gap_signal": false,
  "hidden_transcript_possible": false,
  "defeated_memory_possible": false,
  "external_power_gaze": false,
  "represented_by_self": null,
  "forced_translation_risk": 0.0,
  "metaphor_matrix": [],
  "source_asymmetry_score": 0.0,
  "common_sense_capture_score": 0.0,
  "claim_provenance_confidence": 0.0,
  "memory_fragmentation_score": 0.0,
  "counter_archive_presence_score": 0.0,
  "narrative_custody_chain": [],
  "who_benefits_if_true": [],
  "lost_futures_signal": false,
  "naturalization_detected": false,
  "autonym_exonym_gap": false,
  "official_language_frame": [],
  "counter_archive_quality_score": 0.0,
  "myth_as_memory_signal": false,
  "victimhood_capture_risk": 0.0,
  "time_depth_confidence": 0.0,
  "narrative_time_depth_score": 0.0,
  "custody_break_count": 0,
  "official_vs_self_naming_conflict_score": 0.0,
  "readonly": true,
  "advisory_only": true,
  "emits_act": false,
  "emits_verdict": false,
  "memory_write": false,
  "graphiti_write": false,
  "neo4j_write": false,
  "decision_authority": "KX108_ONLY"
}
```
