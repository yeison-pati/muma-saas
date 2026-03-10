export default function UsuariosHeader({ onCreate }) {
  return (
    <header className="usuarios-header">
      <button type="button" className="usuarios-create-btn" onClick={onCreate}>
        + Crear usuario
      </button>
    </header>
  );
}
