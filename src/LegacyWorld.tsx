import LayerExplorer from './LayerExplorer'
import { useState } from 'react'
import './App.css'

type Territory = {
  id: string
  name: string
  family: string
  description: string
  relations: string[]
}

const territories: Territory[] = [
  { id: 'sens', name: 'SENS / Semantic', family: 'Compréhension',
    description: 'Chantier de compréhension et de structuration sémantique.',
    relations: ['cognition', 'mmonde'] },
  { id: 'cognition', name: 'Cognition', family: 'Couches',
    description: 'Territoire du chantier cognition, avec ses mécanismes et raccordements à documenter.',
    relations: ['sens', 'x108', 'rd'] },
  { id: 'mmonde', name: 'MMonde', family: 'Mémoire monde',
    description: 'Mémoire monde d’Obsidia. Ses parties construites, conceptuelles et en cours ont leur place dans cette interface.',
    relations: ['atlas', 'pepites', 'sens'] },
  { id: 'atlas', name: 'Atlas', family: 'Corpus 5k',
    description: 'Ensemble du corpus dit « les 5k fichiers ». Branchement et stabilisation en cours selon ton indication.',
    relations: ['mmonde', 'pepites'] },
  { id: 'pepites', name: 'Pépites', family: 'Corpus 5k',
    description: 'Ensemble du corpus 5k à rendre navigable. Composition et chemins exacts à raccorder.',
    relations: ['atlas', 'mmonde', 'rd'] },
  { id: 'x108', name: 'X108', family: 'Gouvernance',
    description: 'Autorité décisionnelle KX108_ONLY. Cette interface ne lui attribue aucun nouvel accès ni aucune action.',
    relations: ['cognition', 'gps', 'preuves'] },
  { id: 'gps', name: 'GPS / Défense / Aviation', family: 'Domaines',
    description: 'Point d’entrée du premier parcours : domaine, composants, preuves et chantier R&D.',
    relations: ['x108', 'preuves', 'outils', 'rd'] },
  { id: 'preuves', name: 'Preuves / Receipts', family: 'Vérification',
    description: 'Emplacement prévu pour consulter tests, receipts et provenance. Aucun résultat live chargé dans cette V0.',
    relations: ['x108', 'gps', 'outils'] },
  { id: 'outils', name: 'Interfaces / Outils', family: 'Workspace',
    description: 'Points d’entrée vers Workbench, OS Map, Jarvis et Jarjar. Adresses et disponibilité à vérifier.',
    relations: ['gps', 'rd', 'preuves'] },
  { id: 'rd', name: 'Bureau Pokémon R&D', family: 'Agents',
    description: 'Vue des agents, zones et missions. Cette première version ne contient aucun agent connecté.',
    relations: ['cognition', 'gps', 'outils'] },
]

function LegacyWorld() {
  const [selected, setSelected] = useState('gps')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'world' | 'rd'>('world')
  const current = territories.find(t => t.id === selected)!
  const visible = territories.filter(t =>
    `${t.name} ${t.family}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="shell">
      <header>
        <div><span className="eyebrow">WORKSPACE / V0 LOCALE</span>
          <h1>Monde Obsidia<span>◈</span></h1></div>
        <div className="authority">KX108_ONLY</div>
      </header>

      <nav>
        <button className={view === 'world' ? 'active' : ''}
          onClick={() => setView('world')}>Monde Obsidia</button>
        <button className={view === 'rd' ? 'active' : ''}
          onClick={() => (location.hash = '#agents')}>Bureau Pokémon R&D</button>
      </nav>

      <div className="notice">
        Carte de travail issue de nos échanges · liens proposés · runtime non connecté
      </div>

      {view === 'world' ? <main>
        <section className="map">
          <div className="section-head"><h2>Territoires</h2>
            <input aria-label="Chercher un territoire" placeholder="Chercher un territoire…"
              value={query} onChange={e => setQuery(e.target.value)} /></div>
          <div className="grid">
            {visible.map(t => <button key={t.id}
              className={`territory ${selected === t.id ? 'selected' : ''}`}
              onClick={() => setSelected(t.id)}>
              <span className="symbol">◈</span>
              <small>{t.family}</small><strong>{t.name}</strong>
              <span className="status">Raccord à vérifier</span>
            </button>)}
          </div>
          {visible.length === 0 && <p>Aucun territoire correspondant.</p>}
        </section>

        <aside>
          <span className="eyebrow">{current.family}</span>
          <h2>{current.name}</h2><p>{current.description}</p>
          <h3>Relations proposées</h3>
          <div className="relations">{current.relations.map(id => {
            const target = territories.find(t => t.id === id)!
            return <button key={id} onClick={() => {
              setSelected(id); setQuery('')
            }}>{target.name} ↗</button>
          })}</div>
          <h3>Provenance</h3>
          <p className="muted">Échanges de préparation du monde.
            Concordance documentaire et code à compléter.</p>
          <h3>État de cette vue</h3>
          <p className="muted">Navigation locale disponible.
            Sources, preuves et connexions live non chargées.</p>
          {current.id === 'rd' &&
            <button className="primary" onClick={() => (location.hash = '#agents')}>
              Ouvrir le bureau R&D →</button>}
        </aside>
      </main> : <section className="office">
        <span className="eyebrow">VUE R&D / À CONSTRUIRE</span>
        <h2>Bureau Pokémon R&D</h2>
        <p>Zones de travail réservées. Aucun agent ni mission live connecté.</p>
        <div className="zones">
          {['SENS / Semantic', 'Cognition', 'GPS / Défense', 'Interface Monde']
            .map(name => <div className="zone" key={name}>
              <span>◇</span><strong>{name}</strong><small>Zone proposée</small>
            </div>)}
        </div>
        <button className="primary" onClick={() => {
          setSelected('rd'); setView('world')
        }}>Voir le territoire R&D dans le monde →</button>
      </section>}
      <LayerExplorer />
      <footer>Obsidia · Territoires, couches, chantiers et preuves</footer>
    </div>
  )
}

export default LegacyWorld

