import { useEffect, useState } from 'react'
type Layer = {
  id: string
  title: string
  path: string
  branch: string
  commit: string
  content: string
}
export default function LayerExplorer() {
  const [layers, setLayers] = useState<Layer[]>([])
  const [selected, setSelected] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/data/obsidia-layers.json', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Catalogue : HTTP ${response.status}`)
        return response.json()
      })
      .then(data => {
        if (!Array.isArray(data.layers) || !data.layers.length)
          throw new Error('Catalogue vide ou invalide')
        setLayers(data.layers)
        setSelected(data.layers[0].id)
        setLoading(false)
      })
      .catch(error => {
        if (controller.signal.aborted) return
        setError(String(error))
        setLoading(false)
      })
    return () => controller.abort()
  }, [])
  const current = layers.find(layer => layer.id === selected)
  const visible = layers.filter(layer =>
    `${layer.title} ${layer.id} ${layer.content}`
      .toLowerCase().includes(query.toLowerCase()))
  return <section className="layer-explorer">
    <div className="section-head">
      <h2>Couches documentées ({layers.length})</h2>
      <input aria-label="Rechercher dans les couches"
        placeholder="Chercher dans les sources"
        value={query} onChange={event => setQuery(event.target.value)} />
    </div>
    {loading && <p>Chargement du catalogue...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && <div className="layer-layout">
      <div className="layer-list">
        {visible.map(layer => <button key={layer.id}
          className={selected === layer.id ? 'layer-choice chosen' : 'layer-choice'}
          onClick={() => setSelected(layer.id)}>
          <small>{layer.id}</small>
          <strong>{layer.title}</strong>
        </button>)}
        {!visible.length && <p>Aucune source correspondante.</p>}
      </div>
      {current && <article className="layer-document">
        <span className="eyebrow">SOURCE DOCUMENTAIRE</span>
        <h2>{current.title}</h2>
        <p className="muted">
          Branche : {current.branch}<br />
          Commit : {current.commit.slice(0, 12)}<br />
          Runtime actuel : non vérifié
        </p>
        <a className="source-link"
          href={`https://github.com/Eaubin08/obsidia-x108-proofs/blob/${current.commit}/${current.path}`}
          target="_blank" rel="noreferrer">Ouvrir la source GitHub</a>
        <pre className="source-content">{current.content}</pre>
      </article>}
    </div>}
  </section>
}
