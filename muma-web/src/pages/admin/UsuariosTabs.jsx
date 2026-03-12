export default function UsuariosTabs({ tab, setTab }) {
  return (
    <div className="usuarios-tabs">
      <button
        type="button"
        className={tab === 'quoters' ? 'active' : ''}
        onClick={() => setTab('quoters')}
      >
        Cotizadores
      </button>
      <button
        type="button"
        className={tab === 'sales' ? 'active' : ''}
        onClick={() => setTab('sales')}
      >
        Comerciales
      </button>
      <button
        type="button"
        className={tab === 'designers' ? 'active' : ''}
        onClick={() => setTab('designers')}
      >
        Diseñadores
      </button>
      <button
        type="button"
        className={tab === 'developers' ? 'active' : ''}
        onClick={() => setTab('developers')}
      >
        Desarrollo
      </button>
    </div>
  );
}
